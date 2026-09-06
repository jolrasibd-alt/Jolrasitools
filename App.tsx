
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import { ToolId } from './types';
import PostGenerator from './tools/PostGenerator';
import AdDesigner from './tools/AdDesigner';
import BgRemover from './tools/BgRemover';
import Photoshoot from './tools/Photoshoot';
import StoryboardGenerator from './tools/StoryboardGenerator';
import SubtitleTranslator from './tools/SubtitleTranslator';
import VideoScriptGenerator from './tools/VideoScriptGenerator';
import WelcomeScreen from './tools/WelcomeScreen';
import VirtualTryOn from './tools/VirtualTryOn';
import ModelFromGarment from './tools/ModelFromGarment';
import VideoPromptGeneratorTool from './tools/VideoPromptGenerator';
import AdFunnelGenerator from './tools/AdFunnelGenerator';
import AdCopyGenerator from './tools/AdCopyGenerator';
import { SettingsProvider } from './context/SettingsContext';
import SettingsModal from './components/SettingsModal';
import AiFashionStudio from './tools/AiFashionStudio';
import ViralPostGenerator from './tools/ViralPostGenerator';
import WatermarkRemover from './tools/WatermarkRemover';
import PromotionalPostGenerator from './tools/PromotionalPostGenerator';
import AiVoiceoverStudio from './tools/AiVoiceoverStudio';
import ConceptArchitect from './tools/ConceptArchitect';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderTool = () => {
    switch (activeTool) {
      case 'post-generator':
        return <PostGenerator />;
      case 'ad-copy-generator':
        return <AdCopyGenerator />;
      case 'viral-post-generator':
        return <ViralPostGenerator />;
      case 'ai-content-studio':
        return <AiFashionStudio />;
      case 'watermark-remover':
        return <WatermarkRemover />;
      case 'garment-enhancer':
        return <AdDesigner />;
      case 'bg-remover':
        return <BgRemover />;
      case 'virtual-try-on':
        return <VirtualTryOn />;
      case 'model-from-garment':
        return <ModelFromGarment />;
      case 'video-prompt-generator':
        return <VideoPromptGeneratorTool />;
      case 'ad-funnel-generator':
        return <AdFunnelGenerator />;
      case 'photoshoot':
        return <Photoshoot />;
      case 'promotional-post-generator':
        return <PromotionalPostGenerator />;
      case 'storyboard-generator':
        return <StoryboardGenerator />;
      case 'subtitle-translator':
        return <SubtitleTranslator />;
      case 'ai-voiceover-studio':
        return <AiVoiceoverStudio />;
      case 'concept-architect':
        return <ConceptArchitect />;
      case 'video-script-generator':
        return <VideoScriptGenerator />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <SettingsProvider>
      <div className="flex min-h-screen bg-[#0d1117] text-white font-sans">
        <Sidebar 
          activeTool={activeTool} 
          setActiveTool={setActiveTool} 
          openSettings={() => setIsSettingsOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
          {renderTool()}
        </main>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    </SettingsProvider>
  );
};

export default App;