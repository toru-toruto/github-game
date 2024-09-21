import { MouseEvent, useCallback, useState } from "react";
import { db } from "@/firebase-config/firebase-config";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export const useWebRtcConnection = () => {
  const configuration = {
    iceServers: [
      {
        urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
      },
    ],
  };

  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | undefined>();
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | undefined>();

  const [roomId, setRoomId] = useState<string | null>(null);

  const createDataChannel = (newDataChannel: RTCDataChannel) => {
    newDataChannel.onopen = () => {
      console.log("Data channel is open");
    };
    newDataChannel.onmessage = (event) => {
      console.log("Got message:", event.data);
    };
    newDataChannel.onclose = () => {
      console.log("Data channel is closed");
    };
    newDataChannel.onerror = (error) => {
      console.error("Data channel error:", error);
    };
    setDataChannel(newDataChannel);
  };

  const registerPeerConnectionListeners = useCallback((newPeerConnection: RTCPeerConnection) => {
    if (!newPeerConnection) return;

    newPeerConnection?.addEventListener("icegatheringstatechange", () => {
      console.log(`ICE gathering state changed: ${newPeerConnection?.iceGatheringState}`);
    });

    newPeerConnection?.addEventListener("connectionstatechange", () => {
      console.log(`Connection state change: ${newPeerConnection?.connectionState}`);
    });

    newPeerConnection?.addEventListener("signalingstatechange", () => {
      console.log(`Signaling state change: ${newPeerConnection?.signalingState}`);
    });

    newPeerConnection?.addEventListener("iceconnectionstatechange ", () => {
      console.log(`ICE connection state change: ${newPeerConnection?.iceConnectionState}`);
    });

    newPeerConnection?.addEventListener("datachannel", (event) => {
      const receiveChannel = event.channel;
      createDataChannel(receiveChannel);
    });
  }, []);

  // functions for creating a room
  const collectCandidates = (
    newPeerConnection: RTCPeerConnection,
    roomRef: DocumentReference<DocumentData, DocumentData>,
    candidatesDataName: string
  ) => {
    newPeerConnection?.addEventListener("icecandidate", (event) => {
      if (!event.candidate) {
        console.log("Got final candidate!");
        return;
      }
      console.log("Got candidate: ", event.candidate);
      addDoc(collection(roomRef, candidatesDataName), event.candidate.toJSON());
    });
  };

  const offerRoom = async (
    newPeerConnection: RTCPeerConnection,
    roomRef: DocumentReference<DocumentData, DocumentData>
  ) => {
    console.log(newPeerConnection);
    const offer = await newPeerConnection?.createOffer();
    await newPeerConnection?.setLocalDescription(offer);
    console.log("Created offer:", offer);

    const roomWithOffer = {
      offer: {
        type: offer?.type,
        sdp: offer?.sdp,
      },
    };
    await setDoc(roomRef, roomWithOffer);
    setRoomId(roomRef.id);
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
  };

  const listenRemoteDescription = async (
    newPeerConnection: RTCPeerConnection,
    roomRef: DocumentReference<DocumentData, DocumentData>
  ) => {
    onSnapshot(roomRef, async (snapshot) => {
      const data = snapshot.data();
      if (!newPeerConnection?.currentRemoteDescription && data?.answer) {
        console.log("Set remote description: ", data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await newPeerConnection?.setRemoteDescription(rtcSessionDescription);
      }
    });
  };

  const listenCandidates = async (
    newPeerConnection: RTCPeerConnection,
    roomRef: DocumentReference<DocumentData, DocumentData>,
    candidatesDataName: string
  ) => {
    onSnapshot(collection(roomRef, candidatesDataName), (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await newPeerConnection?.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  // end of functions for creating a room

  // functions for joining a room
  const answerOffer = async (
    newPeerConnection: RTCPeerConnection,
    roomRef: DocumentReference<DocumentData, DocumentData>,
    roomSnapshot: DocumentSnapshot<DocumentData, DocumentData>
  ) => {
    const offer = roomSnapshot.data()?.offer;
    console.log("Got offer:", offer);
    await newPeerConnection?.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await newPeerConnection?.createAnswer();
    console.log("Created answer:", answer);
    await newPeerConnection?.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer?.type,
        sdp: answer?.sdp,
      },
    };
    await updateDoc(roomRef, roomWithAnswer);
  };
  // end of functions for joining a room

  const createRoom = async () => {
    const roomRef = doc(collection(db, "rooms"));

    console.log("Create PeerConnection with configuration: ", configuration);
    const newPeerConnection = new RTCPeerConnection(configuration);
    createDataChannel(newPeerConnection?.createDataChannel("my-chat"));
    registerPeerConnectionListeners(newPeerConnection);
    collectCandidates(newPeerConnection, roomRef, "callerCandidates");
    offerRoom(newPeerConnection, roomRef);
    listenRemoteDescription(newPeerConnection, roomRef);
    listenCandidates(newPeerConnection, roomRef, "calleeCandidates");
    console.log(newPeerConnection);

    setPeerConnection(newPeerConnection);
  };

  const joinRoomById = async (roomId: string) => {
    console.log(roomId);
    const roomRef = doc(collection(db, "rooms"), roomId);
    const roomSnapshot = await getDoc(roomRef);
    console.log("Got room:", roomSnapshot.exists());

    if (roomSnapshot.exists()) {
      console.log("Create PeerConnection with configuration: ", configuration);
      const newPeerConnection = new RTCPeerConnection(configuration);
      // createDataChannel(newPeerConnection);
      registerPeerConnectionListeners(newPeerConnection);
      collectCandidates(newPeerConnection, roomRef, "calleeCandidates");
      answerOffer(newPeerConnection, roomRef, roomSnapshot);
      listenCandidates(newPeerConnection, roomRef, "callerCandidates");
      setRoomId(roomId);
      console.log(newPeerConnection);

      setPeerConnection(newPeerConnection);
    }
  };

  const hangUp = async (ev: MouseEvent<HTMLInputElement>) => {
    if (peerConnection) {
      dataChannel?.close();
      peerConnection.close();
    }

    if (roomId) {
      const roomRef = doc(collection(db, "rooms"), roomId);
      const calleeCandidates = await getDocs(collection(roomRef, "calleeCandidates"));
      calleeCandidates.forEach(async (candidate) => {
        await deleteDoc(candidate.ref);
      });
      const callerCandidates = await getDocs(collection(roomRef, "callerCandidates"));
      callerCandidates.forEach(async (candidate) => {
        await deleteDoc(candidate.ref);
      });
      await deleteDoc(roomRef);
      setRoomId("");
    }
  };

  const sendMessage = (message: string) => {
    if (!peerConnection) {
      console.error("PeerConnection is not created");
      return;
    }
    console.log(
      "Send message:",
      message,
      peerConnection?.connectionState,
      dataChannel,
      dataChannel?.readyState
    );
    console.log(dataChannel?.onmessage);
    dataChannel?.send(message);
  };

  return { roomId, createRoom, joinRoomById, hangUp, sendMessage };
};
