import React, {Component} from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Dimensions} from 'react-native';
import { ColorPicker } from 'react-native-color-picker'
import hexRgb from 'hex-rgb';
import Toast, {BaseToast} from 'react-native-toast-message';
import axios from 'axios';

var width : number = Dimensions.get('window').width;
var height : number = Dimensions.get('window').height;

export default class SmartLight extends Component{

    singleColor(obj: any){
        obj.randomize = false;
        obj.red = obj.red || 0;
        obj.green = obj.green || 0;
        obj.blue = obj.blue || 0;
        //console.log(obj);
        Toast.show({
            type: 'success',
            text1: 'Processing Please Wait...',
            visibilityTime: 5000
        })
        axios.post("http://johnnyspi.ddns.net:8000/lights", obj) .then((response) => {
            console.log(response.data)
            Toast.show({
                type: 'success',
                text1: response.data,
                visibilityTime: 2000
            })
        }, (error) => {
            console.log(error);
            Toast.show({
                type: 'error',
                text1: 'Could not configure light settings.',
                visibilityTime: 2000
            })
        })
    }

    randomize(){
        let obj : any = {}
        obj.randomize = true;
        obj.red = Math.floor(Math.random()*256)
        obj.green = Math.floor(Math.random()*256)
        obj.blue = Math.floor(Math.random()*256)
        //console.log(obj);
        Toast.show({
            type: 'success',
            text1: 'Processing Please Wait...',
            visibilityTime: 5000
        })
        axios.post("http://johnnyspi.ddns.net:8000/lights", obj) .then((response) => {
            console.log(response.data)
            //setTimeout(() => {
            Toast.show({
                type: 'success',
                text1: response.data,
                visibilityTime: 2000
            })
        }, (error) => {
            console.log(error);
            Toast.show({
                type: 'error',
                text1: 'Could not configure light settings.',
                visibilityTime: 2000
            })
        })
    }

    preset(themeType: string){
        let obj : any = {}
        obj.themeType = themeType;
        //console.log(obj);
        Toast.show({
            type: 'success',
            text1: 'Processing Please Wait...',
            visibilityTime: 2000
        })
        axios.post("http://johnnyspi.ddns.net:8000/lights", obj) .then((response) => {
            console.log(response.data)
            Toast.show({
                type: 'success',
                text1: response.data,
                visibilityTime: 2000
            })
        }, (error) => {
            console.log(error);
            Toast.show({
                type: 'error',
                text1: 'Could not configure light settings.',
                visibilityTime: 2000
            })
        })
    }

    render(){
        const toastConfig = {
            success: ({ text1, text2, ...rest } : any) => (
              <BaseToast
                {...rest}
                style={{ borderLeftColor: '#FF9900', backgroundColor: "#fff" }}
                contentContainerStyle={{ paddingHorizontal: 15 }}
                text1Style={{
                  fontSize: 18,
                  fontWeight: 'bold'
                }}
                text2Style={{
                    color: "#000",
                    fontSize: 12
                }}
                text1={text1}
                text2={text2}
              />
            ),

            error: ({ text1, text2, ...rest } : any) => (
                <BaseToast
                  {...rest}
                  style={{ borderLeftColor: '#FF9900', backgroundColor: "#fff" }}
                  contentContainerStyle={{ paddingHorizontal: 15 }}
                  text1Style={{
                    fontSize: 18,
                    fontWeight: 'bold'
                  }}
                  text2Style={{
                      color: "#000",
                      fontSize: 10
                  }}
                  text1={text1}
                  text2={text2}
                />
              )
        }
        return(
            <View style={{flex:1, backgroundColor: '#222222', paddingTop: 20, alignItems: 'center'}}>
                <Toast style={{zIndex: 1}} config={toastConfig} ref={(ref) => Toast.setRef(ref)} />
                <ColorPicker
                    onColorSelected={color => (this.singleColor(hexRgb(color)))}
                    hideSliders={false}
                    style={{width: width-60, height: height/2, paddingBottom: 20}}
                />
                <TouchableOpacity
                    style={styles.button}
                    onPress={()=>this.randomize()}>
                    <Text style={styles.text}>Randomize</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={()=>this.preset('halloween')}>
                    <Text style={styles.text}>Halloween Theme</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={()=>this.preset('christmas')}>
                    <Text style={styles.text}>Christmas Theme</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={()=>this.singleColor({})}>
                    <Text style={styles.text}>Off</Text>
                </TouchableOpacity>
          </View>
        )
    }
}

const styles = StyleSheet.create ({

    button: {
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
        height: 40,
        borderRadius: 20,
        width: width-120,
        margin: 10,
        borderWidth: 2,
        borderColor: "#ffa31a",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1.00,
        shadowRadius: 10,
        elevation: 10,
    },

    text: {
        color: '#fff',
        fontSize: 20,
    }
})