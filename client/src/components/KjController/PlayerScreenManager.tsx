import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Device } from '../../store/appStore';
import { 
  ComputerDesktopIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  TicketIcon, 
  Bars3Icon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  QrCodeIcon,
  ArrowTopRightOnSquareIcon,
  EyeIcon,
  XCircleIcon,
  WifiIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

const PlayerScreenManager: React.FC = () => {
  const {
    devices,
    fetchDevices,
    toggleDeviceAudio,
    toggleDeviceTicker,
    toggleDeviceSidebar,
    toggleDeviceVideoPlayer,
    identifyDevice,
    disconnectDevice,
    serverInfo,
    checkServerInfo,
  } = useAppStore();

  useEffect(() => {
    fetchDevices();
    checkServerInfo();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices, checkServerInfo]);

  const playerUrl = serverInfo.localIps.length > 0 ? `http://${serverInfo.localIps[0]}:${serverInfo.port}/player` : '/player';

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold">Player Screens</h2>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-8 px-4">
            <ComputerDesktopIcon className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-500" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Player Screens Connected</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              To show karaoke lyrics and videos, connect a display (like a TV or projector).
            </p>
            <div className="mt-6 text-left space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <h4 className="font-semibold flex items-center"><ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2"/>Option 1: Use a Web Browser</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">On any device with a web browser (like a Smart TV, laptop, or tablet), open the browser and go to:</p>
                <div className="mt-2">
                  <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="text-lg font-mono bg-gray-200 dark:bg-gray-800 px-3 py-2 rounded-md text-blue-600 dark:text-blue-400 hover:underline">
                    {playerUrl}
                  </a>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
              <div>
                <h4 className="font-semibold flex items-center"><QrCodeIcon className="h-5 w-5 mr-2"/>Option 2: Use the KJ-Nomad App</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">For the best performance, install and run the KJ-Nomad app on another computer, and select "Set up as Player" on launch. It will automatically find and connect to your server.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(devices) && devices.map((device: Device, index) => (
              <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {device.isOnline ? (
                      <WifiIcon className="h-8 w-8 text-green-500" />
                    ) : (
                      <SignalSlashIcon className="h-8 w-8 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Screen {index + 1}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {device.viewport.width}x{device.viewport.height} - {device.browser} on {device.os}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {device.isApp ? 'KJ-Nomad App' : 'Web Browser'} - {device.ipAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => identifyDevice(device.id)}
                    className="p-2 rounded-full"
                    title="Identify Screen"
                  >
                    <EyeIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeviceAudio(device.id)}
                    className={clsx('p-2 rounded-full', { 'bg-blue-100 dark:bg-blue-900/50': device.isAudioEnabled })}
                    title={device.isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
                  >
                    {device.isAudioEnabled ? (
                      <SpeakerWaveIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <SpeakerXMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeviceTicker(device.id)}
                    className={clsx('p-2 rounded-full', { 'bg-blue-100 dark:bg-blue-900/50': device.isTickerVisible })}
                    title={device.isTickerVisible ? 'Hide Ticker' : 'Show Ticker'}
                  >
                    <TicketIcon className={clsx("h-6 w-6", device.isTickerVisible ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeviceSidebar(device.id)}
                    className={clsx('p-2 rounded-full', { 'bg-blue-100 dark:bg-blue-900/50': device.isSidebarVisible })}
                    title={device.isSidebarVisible ? 'Hide Sidebar' : 'Show Sidebar'}
                  >
                    <Bars3Icon className={clsx("h-6 w-6", device.isSidebarVisible ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300')} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDeviceVideoPlayer(device.id)}
                    className={clsx('p-2 rounded-full', { 'bg-blue-100 dark:bg-blue-900/50': device.isVideoPlayerVisible })}
                    title={device.isVideoPlayerVisible ? 'Hide Video Player' : 'Show Video Player'}
                  >
                    {device.isVideoPlayerVisible ? (
                      <VideoCameraIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <VideoCameraSlashIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectDevice(device.id)}
                    className="p-2 rounded-full"
                    title="Disconnect Screen"
                  >
                    <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerScreenManager;
