import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useUser();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Login automático sem validação
    login();
    toast({
      title: "Bem-vindo(a)!",
      description: "Que bom te ver por aqui!",
    });
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
      {/* Background decoration (opcional) */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/devocional-bg.png')] opacity-10 bg-cover bg-center pointer-events-none" />

      <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm z-10">
        <CardHeader className="flex flex-col items-center space-y-4 pb-2">
          <div className="w-48 h-48 relative mb-2">
             <img 
               src="/logo/arca-logo-1.png" 
               alt="Arca da Alegria" 
               className="w-full h-full object-contain drop-shadow-md"
             />
          </div>
          <h1 className="text-2xl font-bold text-blue-600 text-center">Bem-vindo à Arca!</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-blue-200 focus:border-blue-400 bg-blue-50/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-blue-200 focus:border-blue-400 bg-blue-50/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              Entrar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500 italic text-center font-medium">
            "Ensina a criança no caminho em que deve andar, e, ainda quando for velho, não se desviará dele."
          </p>
          <p className="text-xs text-gray-400 mt-1">Provérbios 22:6</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
