// src/utils/rtlSupport.js
import { I18nManager } from 'react-native';

export const configureRTL = () => {
  // Force RTL layout for Hebrew
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
};