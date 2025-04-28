import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SignaturePinModalProps {
  isOpen: boolean;
  isVerifying: boolean;
  onClose: () => void;
  onCreatePin: (pin: string) => void;
  onVerifyPin: (pin: string) => void;
  isProcessing: boolean;
}

const SignaturePinModal: React.FC<SignaturePinModalProps> = ({ 
  isOpen, 
  isVerifying, 
  onClose, 
  onCreatePin, 
  onVerifyPin, 
  isProcessing 
}) => {
  const [pin, setPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Reset error on open
  useEffect(() => {
    if (isOpen) {
      setError("");
      setPin("");
      setConfirmPin("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isVerifying) {
      // PIN verification mode
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setError("PIN must be 4 digits");
        return;
      }
      
      onVerifyPin(pin);
    } else {
      // PIN creation mode
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setError("PIN must be 4 digits");
        return;
      }
      
      if (pin !== confirmPin) {
        setError("PINs do not match");
        return;
      }
      
      onCreatePin(pin);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="bg-[#1e1e1e] border border-gray-800 rounded-md w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-2">
          {isVerifying ? "Verify Signature PIN" : "Create Signature PIN"}
        </h2>
        <p className="text-gray-400 mb-4">
          {isVerifying
            ? "Enter your 4-digit PIN to verify your signature"
            : "Create a secure 4-digit PIN to protect your signature"}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium text-gray-300">
                {isVerifying ? "Your PIN" : "Create PIN"}
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]*"
                autoComplete="off"
                value={pin}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 4) {
                    setPin(val);
                    setError(""); 
                  }
                }}
                className="bg-[#262626] border-gray-700"
                placeholder="Enter 4-digit PIN"
              />
            </div>
            
            {!isVerifying && (
              <div className="space-y-2">
                <Label htmlFor="confirmPin" className="text-sm font-medium text-gray-300">
                  Confirm PIN
                </Label>
                <Input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={confirmPin}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val) && val.length <= 4) {
                      setConfirmPin(val);
                      setError("");
                    }
                  }}
                  className="bg-[#262626] border-gray-700"
                  placeholder="Confirm 4-digit PIN"
                />
              </div>
            )}
            
            {error && (
              <div className="text-red-500 text-sm font-medium">{error}</div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={
                isProcessing ||
                pin.length !== 4 ||
                (!isVerifying && confirmPin.length !== 4)
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : isVerifying ? (
                "Verify PIN"
              ) : (
                "Create PIN"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignaturePinModal;