import TrackPlayer from 'react-native-track-player';
import {getLocalAudioURL, getLocalCoverImageURL} from '../data/AudioBook';
import Logger from '../utils/Logger';
import { audioLoaded } from '../data/Actions';
import * as Crypto from 'expo-crypto';

class RNTrackPlayer {

    constructor() {
        this.audioPlayerInitialized = false;
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

    async generateChapterId(audioPath) {
        const id = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.MD5,
            `${audioPath}`,
            { encoding: Crypto.CryptoEncoding.HEX }
        );
        return id;
    }

    async AudioPlayerAddChpater(book, chapter) {
        if (!this.audioPlayerInitialized)
            await this.init();

        const localPath = await getLocalAudioURL(book, chapter);
        const localCoverImagerPath = await getLocalCoverImageURL(book);
        const id = await this.generateChapterId(localPath);
        await TrackPlayer.add({
            id: id,
            url: localPath,
            type: 'default',
            title: chapter.chapter,
            album: book.title,
            artist: book.author,
            artwork: localCoverImagerPath,
        });
        audioLoaded(true);
        Logger.info(`Chapter ${chapter.chapter} of ${book.title} loaded.`);
    }

    play() {
        TrackPlayer.play();
        Logger.info(`TrackPlayer set to play.`);
    }

    pause() {
        TrackPlayer.pause();
        Logger.info(`TrackPlayer paused.`);
    }
}


const AudioPlayer = new RNTrackPlayer();

export default AudioPlayer;