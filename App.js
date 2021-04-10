import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { func } from './src/constants';
import SplashScreen from 'react-native-splash-screen';
// main navigation stack
import Stack from './src/navigation/Stack';
import AudioPlayer from './src/playback/AudioPlayer';
import Logger, { logLevel } from './src/utils/Logger';
import store from './src/Redux';
import {initDB} from './src/Settings';
import {preFetch} from './src/data/AudioBook';
import SQLite from 'react-native-sqlite-storage';
import { audioLoaded } from './src/data/Actions';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeSong = this.changeSong.bind(this);
    this.playSong = this.playSong.bind(this);
    this.setToggleTabBar = this.setToggleTabBar.bind(this);
    this.state = {
      currentSongData: {
        book: null,
        chapter: null,
        album: 'Swimming',
        artist: 'Mac Miller',
        image: 'swimming',
        length: 312,
        title: 'So It Goes',
        audio: ""
      },
      toggleTabBar: false
    };
  }

  componentDidMount() {
    const init = async () => {
      try {
        SQLite.DEBUG = __DEV__ ? true : false;
        Logger.setLevel(logLevel.INFO);
        Logger.info(`[App.componentDidMount] loading resources.`);
        await func.loadAssetsAsync();
        await initDB();
        await preFetch(100);
        await AudioPlayer.init();
      } catch (e) {
        Logger.error(`[App.componentDidMount] ${JSON.stringify(e)}.`);
      }
    };

    init().then(()=>{
      const { currentSongData: { title, audio } } = this.state;
      SplashScreen.hide();
    }).catch(e => {
        console.log(`${JSON.stringify(e)}`);
    });

  }



  _onPlayPausePressed = () => {
      if (this.state.isPlaying) {
        AudioPlayer.pause();
      } else {
        AudioPlayer.play();
      }
  };

  setToggleTabBar() {
    this.setState(({ toggleTabBar }) => ({
      toggleTabBar: !toggleTabBar
    }));
  }

  changeSong(data) {
    Logger.info(`[App.js changeSong] Chapter changed to ${data.chapter.chapter}`);
    // Set AudioPlayer sates.
    audioLoaded({isLoading: false, isLoaded: false, isPlaying: false});
    // Load current chapter.
    AudioPlayer.AudioPlayerAddChpater(data.book, data.chapter);
    this.setState({
      currentSongData: data
    });
  }

  playSong(play) {
    this.setState({ isPlaying: play }, () => {
      this._onPlayPausePressed();
    });
  }

  render() {
    const { currentSongData, toggleTabBar } = this.state;

    return (
      <Provider store={store}>
      <React.Fragment>
        <StatusBar barStyle="light-content" />

        <Stack
          screenProps={{
            currentSongData,
            changeSong: this.changeSong,
            playPauseCallBack: this.playSong,
            setToggleTabBar: this.setToggleTabBar,
            toggleTabBarState: toggleTabBar
          }}
        />
      </React.Fragment>
      </Provider>
    );
  }
}
