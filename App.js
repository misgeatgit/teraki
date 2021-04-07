import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { func } from './src/constants';
import SplashScreen from 'react-native-splash-screen';
// main navigation stack
import Stack from './src/navigation/Stack';
import ExpoAdioPlayer from './src/playback/playback';
import store from './src/Redux';
import {initDB} from './src/Settings';
import {preFetch, fetchAll} from './src/data/AudioBook';
import SQLite from 'react-native-sqlite-storage';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.changeSong = this.changeSong.bind(this);
    this.playSong = this.playSong.bind(this);
    this.setToggleTabBar = this.setToggleTabBar.bind(this);
    this.state = {
      currentSongData: {
        album: 'Swimming',
        artist: 'Mac Miller',
        image: 'swimming',
        length: 312,
        title: 'So It Goes',
        audio: ""
      },
      isLoading: true,
      toggleTabBar: false
    };
  }

  componentDidMount() {
      func.loadAssetsAsync()
      .then(() => {initDB(); })
      .then(() => { preFetch(100);})
      .then( () => {
        const { currentSongData: { title, audio } } = this.state;
        this.setState({ isLoading: false }); 
        SQLite.DEBUG = true;
        SplashScreen.hide();
      })
      .catch( err => {
        console.warn;
      });
  }



  _onPlayPausePressed = () => {
      if (this.state.isPlaying) {
        ExpoAdioPlayer.pause();
      } else {
        ExpoAdioPlayer.play();
      }
  };

  setToggleTabBar() {
    this.setState(({ toggleTabBar }) => ({
      toggleTabBar: !toggleTabBar
    }));
  }

  changeSong(data) {
    if (data.audio !== "") {
      // Synchronize song update with playbackInstance object creation.
      let loadPlayer = () => {
        const { currentSongData: { title, audio } } = this.state
        ExpoAdioPlayer.load(audio)
      }
      this.setState({
        currentSongData: data
      }, loadPlayer);
    } else {
      this.setState({
        currentSongData: data
      });
    }
  }

  playSong(play) {
    this.setState({ isPlaying: play }, () => {
      this._onPlayPausePressed();
    });
  }

  render() {
    const { currentSongData, isLoading, toggleTabBar } = this.state;
    const eventSubscribers = ExpoAdioPlayer.eventSubscribers;

    return (
      <Provider store={store}>
      <React.Fragment>
        <StatusBar barStyle="light-content" />

        <Stack
          screenProps={{
            currentSongData,
            eventSubscribers,
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
