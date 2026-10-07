import {
  Building2, Tag, MapPinned, Image as ImageIcon, Clock, Car, Zap,
  Store, FileText, History, Plug, CircleParking, Coffee, Wifi,
  Armchair, Bath, CircleDot, BadgeCheck,
} from 'lucide-react';

export const SectionIcons = {
  businessIdentity: Building2,
  categoryType: Tag,
  location: MapPinned,
  photos: ImageIcon,
  hours: Clock,
  services: Car,
  evCharging: Zap,
  facilities: Store,
  documents: FileText,
  history: History,
};

export const FacilityIcons = {
  'Free WiFi': Wifi,
  'Waiting Area': Armchair,
  'Cafe': Coffee,
  'Washroom': Bath,
  'Parking': CircleParking,
};

export const DefaultFacilityIcon = CircleDot;
export const ConnectorIcon = Plug;
export const VerifiedIcon = BadgeCheck;