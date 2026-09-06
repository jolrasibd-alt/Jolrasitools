
import { LucideIcon } from 'lucide-react';

export type ToolId =
  | 'post-generator'
  | 'ad-copy-generator'
  | 'ai-content-studio'
  | 'viral-post-generator'
  | 'watermark-remover'
  | 'garment-enhancer'
  | 'bg-remover'
  | 'virtual-try-on'
  | 'model-from-garment'
  | 'video-prompt-generator'
  | 'ad-funnel-generator'
  | 'photoshoot'
  | 'promotional-post-generator'
  | 'storyboard-generator'
  | 'subtitle-translator'
  | 'ai-voiceover-studio'
  | 'concept-architect'
  | 'video-script-generator';

export interface Tool {
  id: ToolId;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface FileWithPreview extends File {
  preview: string;
}