import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location.startsWith(path);
  };
  
  const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Patients', href: '/patients', icon: Users },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Documentation', href: '/documentation', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center flex-shrink-0 px-4">
          <svg 
            className="h-8 w-8 text-blue-500" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M9 7H7V9H9V7Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M9 15H7V17H9V15Z" 
              fill="currentColor" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M17 7H13V9H17V7Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            <path 
              d="M17 15H13V17H17V15Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          <span className="ml-2 text-xl font-bold text-blue-600">MedAssist</span>
        </div>
        
        <div className="mt-6 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`${
                      isActive(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer`}
                  >
                    <Icon 
                      className={`${
                        isActive(item.href) ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-6 w-6`} 
                    />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* User profile section */}
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex-shrink-0 group block w-full">
            <div className="flex items-center">
              <div>
                <img 
                  className="inline-block h-9 w-9 rounded-full" 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=100&h=100&q=80" 
                  alt="Profile photo" 
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Dr. Sarah Johnson</p>
                <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">View profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
