import React, { createContext, useContext, useState, useEffect } from 'react';
import { Location } from '../types';
import { api } from '../services/api';

interface LocationContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  locations: Location[];
  userCoords: { lat: number; lng: number } | null;
  geoPermission: 'prompt' | 'granted' | 'denied';
  requestUserLocation: () => Promise<{ lat: number; lng: number } | null>;
  isLocating: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return localStorage.getItem('cafekhoj_selected_city') || 'Birtamode';
  });
  const [locations, setLocations] = useState<Location[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoPermission, setGeoPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('cafekhoj_selected_city', selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    api.getLocations()
      .then(data => {
        const list = Array.isArray(data) ? data : (data as any)?.results || [];
        setLocations(list);
      })
      .catch(err => {
        console.warn('Locations API request failed, operating in resilient mode:', err);
      });
  }, []);

  const requestUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    if (!navigator.geolocation) {
      setGeoPermission('denied');
      return null;
    }

    setIsLocating(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(coords);
          setGeoPermission('granted');
          setIsLocating(false);
          resolve(coords);
        },
        (error) => {
          console.warn('Geolocation access denied or unavailable:', error.message);
          setGeoPermission('denied');
          setIsLocating(false);
          resolve(null);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        setSelectedCity,
        locations,
        userCoords,
        geoPermission,
        requestUserLocation,
        isLocating,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};

