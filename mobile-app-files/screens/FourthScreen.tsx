import React, {Component} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Text,
} from 'react-native';
import MaterialCommunityIconsIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import CupertinoFooter2 from '../components/CupertinoFooter2';
import VideoPlayer from 'react-native-video-player';

const Item = ({title}: {title: any}) => (
  <View style={styles.item}>
    <VideoPlayer
      video={{
        uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      }}
      videoWidth={1600}
      videoHeight={900}
      thumbnail={{uri: 'https://i.picsum.photos/id/866/1600/900.jpg'}}
    />
  </View>
);

function FourthScreen(props: any) {
  const renderItem = ({item}: {item: any}) => <Item title={item.title} />;
  return (
    <View style={styles.container}>
      <View style={styles.buttonStack}>
        <View style={styles.rect2}>
          <Image
            source={require('../assets/images/2.png')}
            resizeMode="contain"
            style={styles.image}></Image>
          <View style={styles.placeholderStack1}>
            <TextInput
              editable={false}
              selectTextOnFocus={false}
              placeholder="Search Playlist"
              textBreakStrategy="highQuality"
              style={styles.inputone}></TextInput>
          </View>

          <View style={styles.rect3}>
            <View style={styles.rect4}></View>
          </View>
          <View style={styles.rect5}></View>
          <View style={styles.rect6}></View>
          <View style={styles.iconRow}>
            <MaterialCommunityIconsIcon
              name="message-processing"
              style={styles.icon}></MaterialCommunityIconsIcon>
            <FeatherIcon name="info" style={styles.icon2}></FeatherIcon>
          </View>
        </View>
      </View>
      <CupertinoFooter2 style={styles.cupertinoFooter2}></CupertinoFooter2>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: -40,
    width: 460,
    height: 500,
    position: 'absolute',
  },
  main: {
    flex: 1,
    margin: 40,
  },

  image1: {
    width: 600,
    height: 110,
    position: 'absolute',
  },
  inputone: {
    top: 4,
    left: 0,
    position: 'absolute',
    fontFamily: 'roboto-regular',
    color: 'black',
    height: 38,
    width: 308,
    fontSize: 22,

    borderWidth: 0,
    borderColor: '#000000',
    borderBottomWidth: 3,
  },
  hrline: {
    width: 273,
    height: 5,
    backgroundColor: 'rgba(0,0,0,1)',
    marginTop: 0,
    marginLeft: 23,
  },
  flatv: {
    height: '80%',
    position: 'absolute',
    top: 90,
    left: 2,
  },
  button: {
    top: 44,
    left: 12,
    width: 255,
    height: 38,
    position: 'absolute',
    backgroundColor: '#E6E6E6',
    borderWidth: 1,
    borderColor: 'rgba(126,211,33,1)',
  },
  rect2: {
    top: 0,
    width: 394,
    height: 600,
    position: 'absolute',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 20,
    left: 0,
  },
  image: {
    width: 71,
    height: 38,
    marginTop: 6,
    marginLeft: 330,
  },
  placeholder: {
    top: 4,
    left: 0,
    position: 'absolute',
    fontFamily: 'roboto-regular',
    color: '#121212',
    height: 40,
    width: 308,
    textAlign: 'center',
    fontSize: 17,
    borderRightColor: 'while',
    borderLeftColor: 'green',
    shadowColor: 'rgba(0,0,0,1)',
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  icon3: {
    top: 0,
    left: 280,
    position: 'absolute',
    color: 'rgba(128,128,128,1)',
    fontSize: 40,
    height: 44,
    width: 40,
  },
  placeholderStack: {
    width: 350,
    height: 44,
    marginTop: 0,
    marginLeft: 21,
  },
  placeholderStack1: {
    width: 189,
    height: 44,
    borderBottomColor: 'green',
    borderLeftColor: '#fff',
    marginTop: -45,
  },
  rect3: {
    width: 6,
    height: 279,
    backgroundColor: 'rgba(126,211,33,1)',
    marginTop: 12,
    marginLeft: 380,
  },
  rect4: {
    width: 6,
    height: 100,
    backgroundColor: 'rgba(126,211,33,1)',
  },
  rect5: {
    width: 8,
    height: 70,
    backgroundColor: 'rgba(0,0,0,1)',
    marginTop: 1,
    marginLeft: 380,
  },
  rect6: {
    width: 8,
    height: 100,
    backgroundColor: 'rgba(189,16,224,1)',
    marginLeft: 380,
  },
  icon: {
    color: 'rgba(208,94,2,1)',
    fontSize: 23,
    height: 23,
    width: 23,
    marginLeft: 0,
    marginTop: 6,
  },
  icon2: {
    color: 'rgba(208,94,2,1)',
    fontSize: 23,
    height: 23,
    width: 23,
    marginLeft: 333,
    marginTop: 0,
  },
  iconRow: {
    height: 25,
    flexDirection: 'row',
    marginTop: 18,
    marginLeft: 12,
    marginRight: 5,
  },
  buttonStack: {
    width: 356,
    height: 668,
    marginTop: 44,
    marginLeft: 10,
  },
  cupertinoFooter2: {
    height: 50,
    width: 400,
    marginTop: 12,
    marginLeft: 5,
    top: 640,
    position: 'absolute',
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 2,
    marginVertical: 2,
    marginHorizontal: 3,
  },
  title: {
    fontSize: 32,
  },
});

export default FourthScreen;
