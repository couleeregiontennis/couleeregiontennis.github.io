import { useState, useEffect } from 'react';

function usePlatform() {
 const [platform, setPlatform] = useState('unknown');

 useEffect(() => {
   const detectPlatform = () => {
     const userAgent = navigator.userAgent.toLowerCase();
     
     if (/iphone|ipad|ipod/.test(userAgent)) {
       return 'ios';
     } else if (/android/.test(userAgent)) {
       return 'android';
     } else if (/mobile/.test(userAgent)) {
       return 'mobile'; // other mobile devices
     } else {
       return 'desktop';
     }
   };

   setPlatform(detectPlatform());
 }, []);

 return platform;
}

export { usePlatform as default };