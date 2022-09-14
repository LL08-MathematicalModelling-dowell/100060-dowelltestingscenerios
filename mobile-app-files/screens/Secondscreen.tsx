import React, {Component} from 'react';
import {StyleSheet, View, Image, Pressable} from 'react-native';

function Secondscreen({navigation}: {navigation: any}) {
  return (
    <View style={styles.container}>
      <Pressable
        // accessibilityRole="button"
        onPress={() => navigation.navigate('ThirdScreen')}>
        <Image
          source={require('../assets/images/1.png')}
          resizeMode="contain"
          style={styles.image}></Image>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: 289,
    height: 152,
    marginTop: 288,
    marginLeft: 43,
  },
});

export default Secondscreen;
