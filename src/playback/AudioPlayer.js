import TrackPlayer from 'react-native-track-player';
import {getLocalAudioURL, getLocalCoverImageURL, generateChapterId} from '../data/AudioBook';
import Logger from '../utils/Logger';
import { audioLoaded } from '../data/Actions';

class RNTrackPlayer {

    constructor() {
        this.audioPlayerInitialized = false;
        this.currentTrakcId = null;
    }

    async init() {
        try{
        await TrackPlayer.setupPlayer();
        TrackPlayer.updateOptions({
            stopWithApp: true,
            capabilities: [
                TrackPlayer.CAPABILITY_PLAY,
                TrackPlayer.CAPABILITY_PAUSE,
                TrackPlayer.CAPABILITY_JUMP_FORWARD,
                TrackPlayer.CAPABILITY_JUMP_BACKWARD,
            ],
        });
        this.audioPlayerInitialized = true;
        Logger.info(`[RNTrackPlyer.init ] Successfully initialized TrackPlayer.`);
    } catch(e) {
        Logger.error(`[RNTrackPlyer.init ] ${JSON.stringify(e)}`);
    }
    }

    async AudioPlayerAddChpater(book, chapter) {
        if (!this.audioPlayerInitialized)
            await this.init();
        // Reset the track player. Currently deals with one audio at a time.
        /*if (this.currentTrakcId) {
            Logger.info(`[AudioPlayer.js AudioPlayerAddChapter] removing previous track ${this.currentTrakcId}.`);
            await TrackPlayer.remove([this.currentTrakcId]);
            Logger.info(`[AudioPlayer.js AudioPlayerAddChapter] player emptied.`);
        }*/
        audioLoaded({isLoading: true, isLoaded: false, isPlaying: false});
        const localPath = await getLocalAudioURL(book, chapter);
        const localCoverImagerPath = await getLocalCoverImageURL(book);
        const id = await generateChapterId(chapter);
        await TrackPlayer.add({
            id: id,
            url: localPath,
            type: 'default',
            title: chapter.chapter,
            album: book.title,
            artist: book.author,
            artwork: localCoverImagerPath,
        });

        if(this.currentTrakcId) {
            await this.pause();
            Logger.fine(`[AudioPlayer.js AudioPlayerAddChapter] Skipping to next track.`);
            await TrackPlayer.skipToNext(); // Instead of this we shold clear the track ?
            Logger.fine(`[AudioPlayer.js AudioPlayerAddChapter] Removing previous track.`);
            await TrackPlayer.remove([this.currentTrakcId]);
        }
        this.currentTrakcId = id;

        audioLoaded({isLoading: false, isLoaded: true, isPlaying: false});
        Logger.info(`[AudioPlayer.js AudioPlayerAddChapter] Loaded ${localPath}.`);
    }

    play() {
        TrackPlayer.play();
        audioLoaded({isPlaying: true});
        Logger.info(`[AudioPlayer.js play] TrackPlayer set to play.`);
    }

    pause() {
        TrackPlayer.pause();
        audioLoaded({isPlaying: false});
        Logger.info(`[AudioPlayer.js pause] TrackPlayer paused.`);
    }
}


const AudioPlayer = new RNTrackPlayer();

export default AudioPlayer;
