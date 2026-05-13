import { useState, useEffect } from "react";
import { useMoreh } from "@/hooks/useMoreh";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MorehGuardProps {
  children: React.ReactNode;
}

export default function MorehGuard({ children }: MorehGuardProps) {
  const { morehPin, updatePin, loading } = useMoreh();
  const [inputPin, setInputPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    if (!loading && !morehPin) {
      setIsSettingUp(true);
    }
  }, [loading, morehPin]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handlePinComplete = async (value: string) => {
    if (isSettingUp) {
      // Setting up for the first time
      const { error } = await updatePin(value);
      if (error) {
        toast.error("Erro ao salvar PIN.");
      } else {
        toast.success("PIN do Moreh configurado com sucesso!");
        setIsSettingUp(false);
        setIsAuthenticated(true);
      }
    } else {
      // Verifying
      if (value === morehPin) {
        setIsAuthenticated(true);
      } else {
        toast.error("PIN incorreto");
        setInputPin("");
      }
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="bg-card p-8 rounded-3xl shadow-lg max-w-sm w-full flex flex-col items-center text-center space-y-6 border border-border">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Shield className="w-8 h-8" />
        </div>
        
        <div>
          <h2 className="text-2xl font-fredoka font-bold text-foreground">
            {isSettingUp ? "Configurar PIN" : "Área do Moreh"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isSettingUp 
              ? "Crie um PIN de 4 dígitos para proteger o painel dos pais."
              : "Digite o PIN de 4 dígitos para acessar o Gestor de Rotina."}
          </p>
        </div>

        <InputOTP
          maxLength={4}
          value={inputPin}
          onChange={setInputPin}
          onComplete={handlePinComplete}
        >
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={0} className="w-14 h-14 text-2xl font-bold bg-muted border-2" />
            <InputOTPSlot index={1} className="w-14 h-14 text-2xl font-bold bg-muted border-2" />
            <InputOTPSlot index={2} className="w-14 h-14 text-2xl font-bold bg-muted border-2" />
            <InputOTPSlot index={3} className="w-14 h-14 text-2xl font-bold bg-muted border-2" />
          </InputOTPGroup>
        </InputOTP>
        
        {isSettingUp && (
          <Button 
            className="w-full mt-4" 
            variant="outline"
            onClick={() => window.history.back()}
          >
            Voltar
          </Button>
        )}
      </div>
    </div>
  );
}
