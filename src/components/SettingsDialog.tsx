import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, User, Check, Camera } from "lucide-react";
import { useUser, AVATARS } from "@/contexts/UserContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/components/ui/use-toast";

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const { name, setName, avatarId, setAvatarId, setCustomAvatar, customAvatar } = useUser();
  const [tempName, setTempName] = useState(name);
  const [tempAvatar, setTempAvatar] = useState(avatarId);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setName(tempName);
    setAvatarId(tempAvatar);
    setOpen(false);
  };

  const handlePhotoUpload = () => {
    document.getElementById('settings-photo-upload')?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomAvatar(reader.result as string);
        setTempAvatar('custom');
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi alterada.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md w-[90%] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-fredoka text-xl">
            <Settings className="w-5 h-5" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            Personalize seu perfil e escolha seu avatar favorito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="pl-9"
                placeholder="Como você quer ser chamado?"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Escolha seu Avatar</Label>
            <div className="flex flex-col gap-4">
              {/* Custom Upload Button - Big Circle */}
              <div className="flex justify-center">
                <input
                  type="file"
                  id="settings-photo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={handlePhotoUpload}
                  className={`relative w-24 h-24 rounded-full border-4 flex items-center justify-center bg-gray-100 overflow-hidden transition-all ${tempAvatar === 'custom' ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {customAvatar ? (
                    <img src={customAvatar} alt="Custom" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Preset Avatars - Row */}
              <div className="flex justify-center gap-4">
                {Object.entries(AVATARS).map(([key, avatar]) => (
                  <button
                    key={key}
                    onClick={() => setTempAvatar(key)}
                    className={`relative p-1 rounded-full transition-all ${tempAvatar === key
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'hover:bg-muted'
                      }`}
                  >
                    <UserAvatar avatarId={key} className="w-12 h-12" />
                    {tempAvatar === key && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center border border-white">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full rounded-xl font-bold">
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
