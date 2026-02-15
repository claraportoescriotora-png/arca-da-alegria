import { ArrowLeft, Bell, Check, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, clearNotifications } = useUser();

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-fredoka text-xl font-bold text-foreground">Notificações</h1>
            </div>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                title="Limpar tudo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="container max-w-md mx-auto px-4 py-6">
        {notifications.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Nenhuma notificação nova</h2>
            <p className="text-muted-foreground">Você está em dia com todas as novidades!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`bg-card p-4 rounded-2xl shadow-sm border-l-4 ${
                  notification.read ? 'border-gray-300 opacity-70' : 'border-blue-500'
                } transition-all`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className={`font-semibold text-foreground ${notification.read ? 'font-normal' : ''}`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {!notification.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                      title="Marcar como lida"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
