import React from 'react';
import {
  BadgePercent,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Fingerprint,
  Globe,
  Globe2,
  Layers,
  MapPinCheck,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface IconResolverProps {
  name?: string;
  className?: string;
}

export const IconResolver: React.FC<IconResolverProps> = ({ name, className = 'w-5 h-5' }) => {
  switch (name) {
    case 'Building2':
      return <Building2 className={className} />;
    case 'Globe':
      return <Globe className={className} />;
    case 'Globe2':
      return <Globe2 className={className} />;
    case 'Fingerprint':
      return <Fingerprint className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'MapPinCheck':
      return <MapPinCheck className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'BadgePercent':
      return <BadgePercent className={className} />;
    case 'MessageSquareCheck':
      return <MessageSquare className={className} />;
    case 'ClipboardList':
      return <ClipboardList className={className} />;
    case 'FileCheck2':
      return <FileCheck2 className={className} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    default:
      return <Briefcase className={className} />;
  }
};
