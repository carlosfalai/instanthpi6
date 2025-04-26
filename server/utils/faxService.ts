import { createWriteStream, readFileSync } from 'fs';
import { resolve } from 'path';
import * as Phaxio from 'phaxio';
import InterFAX from 'interfax';
import phone from 'phone';

// Define the interface for our fax service
export interface FaxService {
  sendFax(options: SendFaxOptions): Promise<SendFaxResult>;
  getFaxStatus(faxId: string): Promise<FaxStatus>;
  listFaxes(options?: ListFaxOptions): Promise<ListFaxResult>;
  downloadFax(faxId: string, filePath: string): Promise<string>;
}

// Interfaces for fax operations
export interface SendFaxOptions {
  to: string;
  filePath?: string;
  fileContent?: Buffer;
  fileName?: string;
  quality?: 'normal' | 'high';
  coverPage?: boolean;
  coverPageText?: string;
  callerId?: string;
  metadata?: Record<string, string>;
}

export interface SendFaxResult {
  success: boolean;
  faxId: string;
  message: string;
}

export type FaxStatus = 
  | 'queued'
  | 'in_progress'
  | 'success'
  | 'failure'
  | 'canceled'
  | 'unknown';

export interface FaxMetadata {
  id: string;
  status: FaxStatus;
  direction: 'sent' | 'received';
  from: string;
  to: string;
  completedAt?: Date;
  numPages?: number;
  cost?: number;
  errorType?: string;
  errorMessage?: string;
}

export interface ListFaxOptions {
  status?: FaxStatus;
  phoneNumber?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  direction?: 'sent' | 'received';
}

export interface ListFaxResult {
  faxes: FaxMetadata[];
  hasMore: boolean;
  nextCursor?: string;
}

// Default implementation using Phaxio
export class PhaxioFaxService implements FaxService {
  private client: any;

  constructor(apiKey: string, apiSecret: string) {
    if (!apiKey || !apiSecret) {
      throw new Error('Phaxio API key and secret are required');
    }
    this.client = new Phaxio(apiKey, apiSecret);
  }

  async sendFax(options: SendFaxOptions): Promise<SendFaxResult> {
    try {
      // Validate and normalize phone number
      const normalizedPhone = phone(options.to);
      if (!normalizedPhone.isValid) {
        throw new Error(`Invalid phone number: ${options.to}`);
      }

      const faxParams: any = {
        to: normalizedPhone.phoneNumber,
        caller_id: options.callerId,
      };

      // Add file from path or buffer
      if (options.filePath) {
        faxParams.file = options.filePath;
      } else if (options.fileContent && options.fileName) {
        faxParams.file = {
          buffer: options.fileContent,
          filename: options.fileName
        };
      } else {
        throw new Error('Either filePath or fileContent+fileName must be provided');
      }

      // Add optional parameters
      if (options.coverPage && options.coverPageText) {
        faxParams.content_url = options.coverPageText;
      }
      
      if (options.metadata) {
        faxParams.tags = options.metadata;
      }

      const response = await this.client.faxes.create(faxParams);
      
      return {
        success: true,
        faxId: response.id.toString(),
        message: 'Fax queued successfully',
      };
    } catch (error) {
      console.error('Error sending fax with Phaxio:', error);
      return {
        success: false,
        faxId: '',
        message: `Failed to send fax: ${(error as Error).message}`,
      };
    }
  }

  async getFaxStatus(faxId: string): Promise<FaxStatus> {
    try {
      const fax = await this.client.faxes.retrieve(faxId);
      return this.mapPhaxioStatus(fax.status);
    } catch (error) {
      console.error('Error getting fax status from Phaxio:', error);
      return 'unknown';
    }
  }

  async listFaxes(options: ListFaxOptions = {}): Promise<ListFaxResult> {
    try {
      const params: any = {};
      
      if (options.status) {
        params.status = this.mapStatusToPhaxio(options.status);
      }
      
      if (options.phoneNumber) {
        params.phone_number = options.phoneNumber;
      }
      
      if (options.startDate) {
        params.created_after = Math.floor(options.startDate.getTime() / 1000);
      }
      
      if (options.endDate) {
        params.created_before = Math.floor(options.endDate.getTime() / 1000);
      }
      
      if (options.limit) {
        params.per_page = options.limit;
      }
      
      if (options.direction) {
        params.direction = options.direction;
      }
      
      const response = await this.client.faxes.list(params);
      
      const faxes = response.data.map((fax: any) => ({
        id: fax.id.toString(),
        status: this.mapPhaxioStatus(fax.status),
        direction: fax.direction,
        from: fax.from_number,
        to: fax.to_number,
        completedAt: fax.completed_at ? new Date(fax.completed_at * 1000) : undefined,
        numPages: fax.num_pages,
        cost: fax.cost,
        errorType: fax.error_type,
        errorMessage: fax.error_message,
      }));
      
      return {
        faxes,
        hasMore: response.paging.total_pages > response.paging.page,
        nextCursor: response.paging.page < response.paging.total_pages 
          ? (response.paging.page + 1).toString() 
          : undefined,
      };
    } catch (error) {
      console.error('Error listing faxes from Phaxio:', error);
      return {
        faxes: [],
        hasMore: false,
      };
    }
  }

  async downloadFax(faxId: string, filePath: string): Promise<string> {
    try {
      const absolutePath = resolve(filePath);
      const writeStream = createWriteStream(absolutePath);
      
      await new Promise<void>((resolve, reject) => {
        this.client.faxes.file(faxId)
          .then((fileStream: any) => {
            fileStream.pipe(writeStream);
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
          })
          .catch(reject);
      });
      
      return absolutePath;
    } catch (error) {
      console.error('Error downloading fax from Phaxio:', error);
      throw error;
    }
  }

  private mapPhaxioStatus(status: string): FaxStatus {
    switch (status) {
      case 'queued':
        return 'queued';
      case 'in_progress':
      case 'sending':
        return 'in_progress';
      case 'success':
      case 'completed':
        return 'success';
      case 'failed':
        return 'failure';
      case 'canceled':
        return 'canceled';
      default:
        return 'unknown';
    }
  }

  private mapStatusToPhaxio(status: FaxStatus): string {
    switch (status) {
      case 'queued':
        return 'queued';
      case 'in_progress':
        return 'in_progress';
      case 'success':
        return 'success';
      case 'failure':
        return 'failed';
      case 'canceled':
        return 'canceled';
      default:
        return '';
    }
  }
}

// Implementation using InterFAX API
export class InterFaxService implements FaxService {
  private client: any;

  constructor(username: string, password: string) {
    if (!username || !password) {
      throw new Error('InterFAX username and password are required');
    }
    this.client = new InterFAX({
      username,
      password
    });
  }

  async sendFax(options: SendFaxOptions): Promise<SendFaxResult> {
    try {
      // Validate and normalize phone number
      const normalizedPhone = phone(options.to);
      if (!normalizedPhone.isValid) {
        throw new Error(`Invalid phone number: ${options.to}`);
      }

      let fileData;
      let fileName;

      if (options.filePath) {
        fileData = readFileSync(options.filePath);
        fileName = options.filePath.split('/').pop() || 'fax.pdf';
      } else if (options.fileContent && options.fileName) {
        fileData = options.fileContent;
        fileName = options.fileName;
      } else {
        throw new Error('Either filePath or fileContent+fileName must be provided');
      }

      const faxParams: any = {
        faxNumber: normalizedPhone.phoneNumber,
        file: fileData,
        fileType: this.determineFileType(fileName)
      };

      if (options.quality === 'high') {
        faxParams.highResolution = true;
      }

      if (options.coverPage && options.coverPageText) {
        faxParams.coverPage = {
          enabled: true,
          subject: 'Fax Cover Page',
          content: options.coverPageText
        };
      }

      const faxId = await this.client.delivery.send(faxParams);
      
      return {
        success: true,
        faxId: faxId.toString(),
        message: 'Fax queued successfully',
      };
    } catch (error) {
      console.error('Error sending fax with InterFAX:', error);
      return {
        success: false,
        faxId: '',
        message: `Failed to send fax: ${(error as Error).message}`,
      };
    }
  }

  async getFaxStatus(faxId: string): Promise<FaxStatus> {
    try {
      const fax = await this.client.outbound.find(faxId);
      return this.mapInterFaxStatus(fax.status);
    } catch (error) {
      console.error('Error getting fax status from InterFAX:', error);
      return 'unknown';
    }
  }

  async listFaxes(options: ListFaxOptions = {}): Promise<ListFaxResult> {
    try {
      const params: any = {};
      
      if (options.startDate) {
        params.lastModifiedSince = options.startDate;
      }
      
      if (options.limit) {
        params.limit = options.limit;
      }
      
      if (options.status) {
        params.status = this.mapStatusToInterFax(options.status);
      }
      
      // InterFAX only supports listing outbound faxes
      const response = await this.client.outbound.completed(params);
      
      const faxes = response.map((fax: any) => ({
        id: fax.id.toString(),
        status: this.mapInterFaxStatus(fax.status),
        direction: 'sent' as const,
        from: '',  // InterFAX doesn't provide sender number in listing
        to: fax.destination || '',
        completedAt: fax.completionTime ? new Date(fax.completionTime) : undefined,
        numPages: fax.pages,
        cost: 0,  // InterFAX doesn't provide cost in API
        errorType: fax.status !== 'Success' ? fax.status : undefined,
        errorMessage: fax.status !== 'Success' ? fax.result : undefined,
      }));
      
      return {
        faxes,
        hasMore: false,  // InterFAX doesn't provide pagination info
      };
    } catch (error) {
      console.error('Error listing faxes from InterFAX:', error);
      return {
        faxes: [],
        hasMore: false,
      };
    }
  }

  async downloadFax(faxId: string, filePath: string): Promise<string> {
    try {
      const absolutePath = resolve(filePath);
      await this.client.outbound.image(faxId, absolutePath);
      return absolutePath;
    } catch (error) {
      console.error('Error downloading fax from InterFAX:', error);
      throw error;
    }
  }

  private mapInterFaxStatus(status: string): FaxStatus {
    switch (status) {
      case 'Pending':
      case 'Rendering':
        return 'queued';
      case 'In Progress':
      case 'Sending':
        return 'in_progress';
      case 'Success':
      case 'OK':
        return 'success';
      case 'Failed':
      case 'Error':
        return 'failure';
      case 'Canceled':
        return 'canceled';
      default:
        return 'unknown';
    }
  }

  private mapStatusToInterFax(status: FaxStatus): string {
    switch (status) {
      case 'queued':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'success':
        return 'Success';
      case 'failure':
        return 'Failed';
      case 'canceled':
        return 'Canceled';
      default:
        return '';
    }
  }

  private determineFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'tif':
      case 'tiff':
        return 'image/tiff';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/pdf';
    }
  }
}

// Factory function to create the appropriate fax service
export function createFaxService(): FaxService {
  // Check for environment variables to decide which service to use
  const phaxioApiKey = process.env.PHAXIO_API_KEY;
  const phaxioApiSecret = process.env.PHAXIO_API_SECRET;
  
  const interfaxUsername = process.env.INTERFAX_USERNAME;
  const interfaxPassword = process.env.INTERFAX_PASSWORD;
  
  // Prefer Phaxio if credentials are available
  if (phaxioApiKey && phaxioApiSecret) {
    console.log('Using Phaxio fax service');
    return new PhaxioFaxService(phaxioApiKey, phaxioApiSecret);
  }
  
  // Fall back to InterFAX if credentials are available
  if (interfaxUsername && interfaxPassword) {
    console.log('Using InterFAX fax service');
    return new InterFaxService(interfaxUsername, interfaxPassword);
  }
  
  // Throw error if no service can be initialized
  throw new Error('No fax service credentials found in environment variables');
}