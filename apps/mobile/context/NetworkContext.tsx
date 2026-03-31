import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { DeviceEventEmitter } from 'react-native';

export interface NetworkContextType {
  isOnline: boolean;
  isSlowConnection: boolean;
  justReconnected: boolean;
  clearJustReconnected: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  isSlowConnection: false,
  justReconnected: false,
  clearJustReconnected: () => {},
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSlowConnection, setIsSlowConnection] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyOnline = state.isConnected && state.isInternetReachable !== false;
      
      setIsOnline(!!currentlyOnline);
      
      // Detection of low-quality connection type (if available from NetInfo)
      if (state.details && 'effectiveType' in state.details) {
        // @ts-ignore
        if (state.details.effectiveType === '2g' || state.details.effectiveType === '3g') {
           setIsSlowConnection(true);
        } else {
           setIsSlowConnection(false);
        }
      }

      if (!currentlyOnline) {
        setWasOffline(true);
      } else if (currentlyOnline && wasOffline) {
        setJustReconnected(true);
        setWasOffline(false);
        setIsSlowConnection(false); // Reset slow connection on reconnect
      }
    });

    return () => unsubscribe();
  }, [wasOffline]);

  // Listen to slow connection events emitted by axios interceptors
  useEffect(() => {
    const sub1 = DeviceEventEmitter.addListener('network:slow', () => {
       setIsSlowConnection(true);
    });
    const sub2 = DeviceEventEmitter.addListener('network:fast', () => {
       setIsSlowConnection(false);
    });

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, []);

  const clearJustReconnected = () => setJustReconnected(false);

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isSlowConnection,
        justReconnected,
        clearJustReconnected,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};
