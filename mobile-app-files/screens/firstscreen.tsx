import React, {Component} from 'react';
import {StyleSheet, View, Image, TouchableWithoutFeedback} from 'react-native';

function FirstScreen({navigation}: {navigation: any}) {
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        accessibilityRole="button"
        onPress={() => navigation.navigate('Secondscreen')}>
        <Image
          source={require('../assets/images/1.png')}
          resizeMode="contain"
          style={styles.image}></Image>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: 99,
    height: 92,
    marginTop: 333,
    marginLeft: 21,
  },
});

export default FirstScreen;
