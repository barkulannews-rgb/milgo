import React from 'react';
import { Language, StoreSettings } from '../../types';

interface AnnouncementBarProps {
  settings: StoreSettings;
  lang: Language;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ settings, lang }) => {
  if (!settings.announcementBarActive) return null;

  const announcementText = lang === 'so' ? settings.announcementBarTextSo : settings.announcementBarTextEn;

  return (
    <div className="bg-inverse text-on-inverse text-[11px] tracking-[0.12em] uppercase py-2 px-4 text-center">
      <span className="opacity-90">{announcementText}</span>
    </div>
  );
};
