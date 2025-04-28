import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, Check } from "lucide-react";

interface SignaturePadProps {
  onComplete: (signatureDataUrl: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container width with a fixed height
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    const context = canvas.getContext('2d');
    if (context) {
      // Set up the context
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.lineWidth = 2.5;
      context.strokeStyle = '#FFFFFF';
      setCtx(context);
    }

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return;
      const prevImg = canvas.toDataURL();
      canvas.width = canvas.offsetWidth;
      
      if (context) {
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.lineWidth = 2.5;
        context.strokeStyle = '#FFFFFF';
        
        // Redraw the previous content
        if (hasContent) {
          const img = new Image();
          img.onload = () => {
            context.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.src = prevImg;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [hasContent]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!ctx) return;
    
    setIsDrawing(true);
    
    // Get the position
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    setLastX(x);
    setLastY(y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return;
    
    // Get the position
    let x, y;
    if ('touches' in e) {
      // Touch event
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      e.preventDefault(); // Prevent scrolling when drawing
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    // Drawing logic
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setLastX(x);
    setLastY(y);
    setHasContent(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasContent(false);
  };

  const completeSignature = () => {
    if (!canvasRef.current || !hasContent) return;
    
    // Get the signature as a data URL
    const signatureDataUrl = canvasRef.current.toDataURL('image/png');
    onComplete(signatureDataUrl);
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-gray-700 rounded-md overflow-hidden bg-[#262626] touch-none"
      >
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseOut={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={clearCanvas}
          className="flex items-center"
          type="button"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Clear
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onComplete('')}
            className="flex items-center"
            type="button"
          >
            <AlertCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          
          <Button 
            onClick={completeSignature}
            disabled={!hasContent}
            className="bg-blue-600 hover:bg-blue-700 flex items-center"
            type="button"
          >
            <Check className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;