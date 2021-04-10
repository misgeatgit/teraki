/* eslint-disable react/destructuring-assignment */
/* eslint-disable prettier/prettier */
import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { withNavigation } from 'react-navigation';
import { FontAwesome } from '@expo/vector-icons';
import { colors, device, gStyle } from '../constants';
import Logger from '../utils/Logger';

class BarMusicPlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      favorited: false,
      isLoaded: false // for sound
    };
    this.toggleFavorite = this.toggleFavorite.bind(this);
    this.togglePlay = this.togglePlay.bind(this);
  }

  toggleFavorite() {
    this.setState(prev => ({
      favorited: !prev.favorited
    }));
  }

  togglePlay(isPlaying) {
    const { playPauseCallBack } = this.props;
    playPauseCallBack(isPlaying);
  }

  render() {
    const { navigation, song, eventSubscribers, selectedAudio } = this.props;
    const {isPlaying} = selectedAudio;
    Logger.info(`[BarMusicPlayer.js render] isPlaying: ${isPlaying}`);

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate('ModalMusicPlayer',{eventSubscribers})}
        style={styles.container}
      >
        <TouchableOpacity
          activeOpacity={gStyle.activeOpacity}
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={this.toggleFavorite}
          style={styles.containerIcon}
        />
        {song && (
        <View style={styles.containerSong}>
          <Text style={styles.title}>{`${song.title} · `}</Text>
          <Text style={styles.artist}>{song.album}</Text>
        </View>
        )}
        {selectedAudio.isLoaded &&
        // eslint-disable-next-line react/jsx-wrap-multilines
        <TouchableOpacity
          activeOpacity={gStyle.activeOpacity}
          hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
          onPress={() => this.togglePlay(isPlaying)}
          style={styles.containerIcon}
        >
          <FontAwesome color={colors.white} name={ isPlaying ? 'pause-circle' : 'play-circle'} size={28} />
        </TouchableOpacity>
        }
        { (!selectedAudio.isLoaded && selectedAudio.isLoading) &&
          <ActivityIndicator size="small" color="white" style={styles.activityIndicator} />
        }
      </TouchableOpacity>
    );
  }
}

BarMusicPlayer.defaultProps = {
  song: null
};

BarMusicPlayer.propTypes = {
  // required
  navigation: PropTypes.object.isRequired,

  // optional
  song: PropTypes.shape({
    artist: PropTypes.string,
    title: PropTypes.string
  })
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: colors.grey,
    borderBottomColor: colors.blackBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    width: '100%'
  },
  containerIcon: {
    ...gStyle.flexCenter,
    width: 50
  },
  containerSong: {
    ...gStyle.flexRowCenter,
    overflow: 'hidden',
    width: device.width - 100
  },
  title: {
    ...gStyle.textSpotify12,
    color: colors.white
  },
  artist: {
    ...gStyle.textSpotify12,
    color: colors.greyLight
  },
  device: {
    ...gStyle.textSpotify10,
    color: colors.brandPrimary,
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  activityIndicator: {
    marginRight: 5
  }
});

const mapStateProps = (state) => {
  const {audioBook: {selectedAudio} } = state;
  return {selectedAudio};
}

export default withNavigation(connect(mapStateProps)(BarMusicPlayer));
