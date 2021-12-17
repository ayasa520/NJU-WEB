## 可见水印

调用`__picWM` 方法即可.

采用的方法是 canvas 加文字转 base64.

关键代码如下, 思路是将图片绘制在画布上, 然后再将水印字体绘制到画布上, 转成 base64 代码通过回调函数 `cb` 加到 img 标签上.

```js
img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.font = font;
    ctx.fillStyle = fillStyle;
    ctx.fillText(content, img.width - textX, img.height - textY);
    const base64Url = canvas.toDataURL();
    cb && cb(base64Url);
}
```

## 数字水印

将文字水印和图片分别绘制到画布上, 调用`getImageData` 获得每个像素点的 `rgba` 信息, 遍历文字的 `rgba`, 如果不是透明的(就是这个像素点有字)就将原图 R 通道最低位设为 1, 否则将原图 R 通道最低位设为 0.

解密水印只要遍历 R 通道的 imagedata, 最低位为 1 说明有字, 最低位为 0 说明没有字, 有字 设成 255, 没字设成 0 就行.|
这里我是设成了反色 (255-rgb).

这里用 Promise , 图片加载完才开始执行最后的工作, 用回调也行.

```js
            let promise= new Promise(function(resolve){
                    getTextData();
                    const img = new Image();
                    img.src = url;
                    img.crossOrigin = 'anonymous';
                    img.onload = function () {
                        ctx.drawImage(img, 0, 0);
                        picData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        resolve(picData);
                    }
               }).then((picData)=>{
                    // console.log(picData);
                
                    // console.log(textData); 
                    for(let i =0;i<picData.data.length;i++){
                        // 只考虑红色
                        if(i%4===0){
                            if(textData.data[i+3]===0){
                            // 文字透明, 则修改原图对应的 R 通道最低位设为 0
                                picData.data[i]&=0b11111110;
                            }else {
                            // 文字有, 则修改原图 R 通道最低位为 1    
                                picData.data[i]|=0b00000001;
                            }
                        }
                    }
                    for(let i =0;i<picData.data.length;i+=4){
                        // 只考虑 R 通道
                        if( picData.data[i]%2===1){
                            picData.data[i]=255-picData.data[i];
                            picData.data[i+1]=255-picData.data[i+1]
                            picData.data[i+2]=255-picData.data[i+2]

                        }
                    } 
                    ctx.putImageData(picData,0,0);
               })
            
        }
```

