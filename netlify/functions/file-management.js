const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight' }) };
  }

  try {
    const pathSegments = event.path.split('/');
    const action = pathSegments[pathSegments.length - 1];

    if (action === 'list') {
      // List all reports
      const reportsDir = '/tmp/reports';
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const files = fs.readdirSync(reportsDir);
      const reports = files
        .filter(file => file.endsWith('.html'))
        .map(file => {
          const stats = fs.statSync(path.join(reportsDir, file));
          return {
            filename: file,
            created: stats.birthtime,
            size: (stats.size / 1024).toFixed(2) + ' KB',
            url: `/reports/${file}`
          };
        })
        .sort((a, b) => new Date(b.created) - new Date(a.created));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          reports
        })
      };

    } else if (action === 'delete') {
      // Delete a specific report
      const { filename } = JSON.parse(event.body);
      
      if (!filename || !filename.endsWith('.html')) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, error: 'Invalid filename' })
        };
      }

      const reportPath = path.join('/tmp/reports', filename);
      
      if (fs.existsSync(reportPath)) {
        fs.unlinkSync(reportPath);
        console.log(`🗑️ Report deleted: ${filename}`);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Report deleted successfully' })
        };
      } else {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ success: false, error: 'Report not found' })
        };
      }

    } else if (action === 'cleanup') {
      // Delete all reports
      const reportsDir = '/tmp/reports';
      
      if (fs.existsSync(reportsDir)) {
        const files = fs.readdirSync(reportsDir);
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        let deletedCount = 0;

        htmlFiles.forEach(file => {
          try {
            fs.unlinkSync(path.join(reportsDir, file));
            deletedCount++;
            console.log(`🧹 Cleaned up report: ${file}`);
          } catch (err) {
            console.error(`Error deleting ${file}:`, err);
          }
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `${deletedCount} reports deleted`,
            deleted: deletedCount
          })
        };
      } else {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'No reports to clean up',
            deleted: 0
          })
        };
      }

    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Action not found' })
      };
    }

  } catch (error) {
    console.error('File management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `File management error: ${error.message}`
      })
    };
  }
};
