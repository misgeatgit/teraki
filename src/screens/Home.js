import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {connect} from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import { colors, device, gStyle } from '../constants';
import { withNavigation } from 'react-navigation';
import logger from '../utils/Logger';

// components
import AlbumsHorizontal from '../components/AlbumsHorizontal';

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      scrollY: new Animated.Value(0)
    };

  }

  filterBook = (tagline, books) => {
    logger.info(`Getting books with tagline ${tagline}`);
    const filtered = books.filter( book => book.tagline === tagline);
    logger.info(`Found ${filtered.length} books with this tagline.`)
    return filtered;
  }

  render() {
    const { scrollY } = this.state;
    const { books } = this.props;
    const opacityIn = scrollY.interpolate({
      inputRange: [0, 128],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    });

    const opacityOut = scrollY.interpolate({
      inputRange: [0, 88],
      outputRange: [1, 0],
      extrapolate: 'clamp'
    });

    return (
      <React.Fragment>
        {device.iPhoneX && (
          <Animated.View style={[styles.iPhoneNotch, { opacity: opacityIn }]} />
        )}

        <Animated.View
          style={[styles.containerHeader, { opacity: opacityOut }]}
        >
          <FontAwesome color={colors.white} name="cog" size={28} />
        </Animated.View>

        <Animated.ScrollView
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={gStyle.container}
        >
          <View style={gStyle.spacer16} />

          <AlbumsHorizontal
            books={this.filterBook('Recently opened', books)}
            heading="በቅርብ የተከፈቱ"
            tagline="Recently viewed"
          />

          <AlbumsHorizontal
            books={this.filterBook('Popular this month', books)}
            heading="በብዙዎች የተነበቡ"
            tagline="Popular this month."
          />

          <AlbumsHorizontal
            books={this.filterBook('Suggestions', books)}
            heading="ምርጫዎቻችን"
            tagline="Books you may like."
          />
        </Animated.ScrollView>
      </React.Fragment>
    );
  }
}

const styles = StyleSheet.create({
  iPhoneNotch: {
    backgroundColor: colors.black70,
    height: 44,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 20
  },
  containerHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: device.iPhoneX ? 60 : 36,
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10
  }
});
const mapStateProps = (state) => {
  logger.info('Books update received from redux store.');
  const {audioBook: {books} } = state;
  books.forEach(book => {
   logger.info(`---COVER_URI: ${book.front_cover_path}`)
  });
  return {books};
}

export default withNavigation(connect(mapStateProps)(Home));
