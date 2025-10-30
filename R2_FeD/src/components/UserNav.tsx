import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { User as UserIcon, LogOut, Settings, Languages, Sun, Moon } from "lucide-react"; // 1. Import Sun and Moon
import { useAuth } from '../contexts/AuthContext';

interface UserNavProps {
  onLogout: () => void;
  onGoToProfile: () => void;
  onGoToAdmin: () => void;
  // 2. Add theme props
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function UserNav({
  onLogout,
  onGoToProfile,
  onGoToAdmin,
  theme,
  onToggleTheme
}: UserNavProps) { // 3. Destructure theme props
  const { user } = useAuth();

  const displayName = user?.name || 'Guest User';
  const displayEmail = user?.email || '';
  const avatarSrc = user?.picture || '';

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0,2)
    .join('')
    .toUpperCase();

  return (
    // 4. Make the root a flex container
    <div className="fixed top-5 right-1 z-[60] flex pr-8 items-center gap-2" data-user-nav-root>

      {/* 5. --- NEW THEME TOGGLE BUTTON --- */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        className="h-10 w-10 rounded-full bg-white/50 text-gray-900 hover:bg-white/70 border border-gray-300/50
                    dark:bg-gray-800/50 dark:text-white dark:hover:bg-gray-700/50 dark:border-gray-700/50
                    backdrop-blur-sm hover:border-blue-600 dark:hover:border-blue-600"
        aria-label="Toggle theme"
      >
        <Sun className="h-5 w-5 block dark:hidden" />
        <Moon className="h-5 w-5 hidden dark:block" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* 6. --- EXISTING USER DROPDOWN --- */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full 
                      bg-white/50 text-gray-900 hover:bg-white/70 border border-gray-300/50
                      dark:bg-gray-800/50 dark:text-white dark:hover:bg-gray-700/50 dark:border-gray-700/50
                      backdrop-blur-sm hover:border-blue-600 dark:hover:border-blue-600"
          >
            <UserIcon className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          // 7. Update styles for light/dark
          className="w-56 bg-white/80 dark:bg-transparent backdrop-blur-3xl border-gray-300 dark:border-gray-700 text-black dark:text-white"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center">
                {avatarSrc ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={avatarSrc} alt="user avatar" className="w-10 h-10 object-cover" />
                ) : (
                  <span className="text-sm font-medium text-gray-800 dark:text-white">{initials}</span>
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium leading-none pb-1">{displayName}</p>
                <p className="text-xs leading-none text-gray-500 dark:text-gray-400">{displayEmail}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-300 dark:bg-gray-700" />

          <DropdownMenuItem
            onClick={onGoToProfile}
            className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4 text-black dark:text-white" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
            <Languages className="mr-2 h-4 w-4 text-black dark:text-white" />
            <span>Language</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-gray-300 dark:bg-gray-700" />
          <DropdownMenuItem
            onClick={onLogout}
            className="focus:bg-red-100 dark:focus:bg-red-900/50 focus:text-red-600 dark:focus:text-red-400 text-red-600 dark:text-red-400 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4 text-red-600 dark:text-red-400" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}