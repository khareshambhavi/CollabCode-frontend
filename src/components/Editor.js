import React, { useEffect, useRef } from 'react';

import 'codemirror//mode/javascript/javascript';
import 'codemirror/theme/dracula.css';
import Codemirror from 'codemirror';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/lib/codemirror.css';
import ACTIONS from '../Actions';

const Editor = ({socketRef, roomId, onCodeChange}) => {
    const editorRef=useRef(null);  
    useEffect(()=>{

        async function init(){
            
           editorRef.current=Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
           }
        );
        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);
            if (origin !== 'setValue') {

                const message = JSON.stringify({
                    type: ACTIONS.CODE_CHANGE,
                    roomId,
                    code,
                  });
        
                  socketRef.current.send(message);
            }
        });
      }
        init();
    },[]);

    useEffect(() => {
        if (socketRef.current) {
            const handleMessage = (event) => { 
                const data = JSON.parse(event.data);
                if (data.type === ACTIONS.CODE_CHANGE) { 
                    const code =  data.code || "";
                    editorRef.current.setValue(code);
                }
            };

            socketRef.current.addEventListener('message', handleMessage);  

            return () => {
                socketRef.current.removeEventListener('message', handleMessage); 
            };
        }
    }, [socketRef.current]);

    // useEffect(() => {
    //     if (socketRef.current) {
    //         socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
    //             if (code !== null) {
    //                 editorRef.current.setValue(code);
    //             }
    //         });
    //     }
    // }, [socketRef.current]);

  return (
    <textarea id ='realtimeEditor' ></textarea>
  )
}

export default Editor