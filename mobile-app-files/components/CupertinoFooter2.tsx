import React, {Component} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import MaterialCommunityIconsIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';

function CupertinoFooter2(props: any) {
  return (
    <View style={[styles.container, props.style]}>
      <TouchableOpacity style={styles.btnWrapper1}>
        <MaterialCommunityIconsIcon
          name="power-settings"
          style={[
            styles.icon,
            {
              color: props.active ? '#000000' : '#616161',
            },
          ]}></MaterialCommunityIconsIcon>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnWrapper3}>
        <MaterialCommunityIconsIcon
          name="shield-half-full"
          style={styles.icon2}></MaterialCommunityIconsIcon>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnWrapper4}>
        <MaterialCommunityIconsIcon
          name="table-search"
          style={styles.icon3}></MaterialCommunityIconsIcon>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnWrapper2}>
        <MaterialCommunityIconsIcon
          name="plus-circle"
          style={styles.icon1}></MaterialCommunityIconsIcon>
      </TouchableOpacity>
      <View style={styles.rect}>
        <IoniconsIcon name="md-person" style={styles.icon4}></IoniconsIcon>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,1)',
    justifyContent: 'space-between',
  },
  btnWrapper1: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    backgroundColor: 'transparent',
    opacity: 0.8,
    fontSize: 39,
  },
  btnWrapper3: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon2: {
    backgroundColor: 'transparent',
    opacity: 0.8,
    fontSize: 41,
    color: '#616161',
  },
  btnWrapper4: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon3: {
    backgroundColor: 'transparent',
    opacity: 0.8,
    fontSize: 41,
    color: 'rgba(208,48,48,1)',
  },
  btnWrapper2: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon1: {
    backgroundColor: 'transparent',
    opacity: 0.8,
    fontSize: 41,
    color: 'rgba(126,211,33,1)',
  },
  rect: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon4: {
    backgroundColor: 'transparent',
    opacity: 0.8,
    fontSize: 39,
    color: 'rgba(0,0,0,1)',
  },
});

export default CupertinoFooter2;
