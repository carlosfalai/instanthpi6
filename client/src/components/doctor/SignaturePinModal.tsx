import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  isProcessing,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#1e1e1e] border-gray-800">
        <DialogHeader>
          <DialogTitle>
            {isVerifying ? "Verify Signature PIN" : "Create Signature PIN"}
          </DialogTitle>
          <DialogDescription>
            {isVerifying
              ? "Enter your 4-digit PIN to verify your signature"
              : "Create a secure 4-digit PIN to protect your signature"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="pin" className="text-sm font-medium text-gray-300">
                {isVerifying ? "Your PIN" : "Create PIN"}
              </label>
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
                <label htmlFor="confirmPin" className="text-sm font-medium text-gray-300">
                  Confirm PIN
                </label>
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
          
          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignaturePinModal;