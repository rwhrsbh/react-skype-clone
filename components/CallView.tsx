
import React, { useEffect, useRef, useState } from 'react';
import type { CallState } from '../types';
import { HangUpIcon, MicOnIcon, MicOffIcon, VideoOnIcon, VideoOffIcon, ScreenShareIcon, ScreenShareOffIcon, CameraFlipIcon } from './icons';

interface CallViewProps {
  callState: CallState;
  onHangUp: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onFlipCamera: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  canFlipCamera: boolean;
}

const CallView: React.FC<CallViewProps> = ({
  callState,
  onHangUp,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onFlipCamera,
  isMuted,
  isVideoEnabled,
  isScreenSharing,
  canFlipCamera,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && callState.localStream) {
      localVideoRef.current.srcObject = callState.localStream;
    }
  }, [callState.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && callState.remoteStream) {
      remoteVideoRef.current.srcObject = callState.remoteStream;
    }
  }, [callState.remoteStream]);

  return (
    <div className="h-full w-full flex flex-col bg-black relative">
      <div className="absolute top-4 left-4 text-white z-20">
        <h2 className="text-2xl font-bold">In call with {callState.with}</h2>
      </div>
      
      {/* Remote Video */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Local Video */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className="absolute bottom-24 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white dark:border-skype-dark z-10"
      />

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-black bg-opacity-50 flex justify-center items-center space-x-4">
        <button
          onClick={onToggleMute}
          className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOffIcon className="w-6 h-6" /> : <MicOnIcon className="w-6 h-6" />}
        </button>
        <button
          onClick={onToggleVideo}
          className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          title={isVideoEnabled ? 'Turn video off' : 'Turn video on'}
        >
          {isVideoEnabled ? <VideoOnIcon className="w-6 h-6" /> : <VideoOffIcon className="w-6 h-6" />}
        </button>
        <button
          onClick={onToggleScreenShare}
          className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
          title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
        >
          {isScreenSharing ? <ScreenShareOffIcon className="w-6 h-6" /> : <ScreenShareIcon className="w-6 h-6" />}
        </button>
        {canFlipCamera && (
          <button
            onClick={onFlipCamera}
            className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors md:hidden"
            title="Flip camera"
          >
            <CameraFlipIcon className="w-6 h-6" />
          </button>
        )}
        <button
          onClick={onHangUp}
          className="w-16 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
          title="Hang Up"
        >
          <HangUpIcon className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};

export default CallView;
