import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Trash2, Check, PartyPopper, Info, Calendar } from "lucide-react";
import { useUser, Notification } from "@/contexts/UserContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function NotificationsSheet({ children }: { children: React.ReactNode }) {
  const { notifications, markNotificationAsRead, clearNotifications } = useUser();

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'achievement': return <PartyPopper className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'reminder': return <Calendar className="w-5 h-5 text-purple-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title="Limpar tudo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-center">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p>Nenhuma notificação por enquanto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    notification.read 
                      ? 'bg-background border-border opacity-70' 
                      : 'bg-card border-primary/20 shadow-sm'
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-full ${
                      notification.read ? 'bg-muted' : 'bg-primary/10'
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold text-sm ${
                        notification.read ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {format(new Date(notification.date), "d 'de' MMMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
