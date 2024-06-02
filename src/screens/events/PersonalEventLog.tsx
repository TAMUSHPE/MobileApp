import { View, TouchableOpacity, ActivityIndicator, Text } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Octicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { queryUserEventLogs } from '../../api/firebaseUtils';
import { UserEventData } from '../../types/events';
import { PublicProfileStackParams } from '../../types/navigation';

const PersonalEventLog = ({ navigation }: NativeStackScreenProps<PublicProfileStackParams>) => {
  const userContext = useContext(UserContext);
  const { userInfo } = userContext!;

  const [events, setEvents] = useState<UserEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserEventLogs = async () => {
      if (auth.currentUser?.uid) {
        try {
          const data = await queryUserEventLogs(auth.currentUser?.uid);
          setEvents(data);
        } catch (error) {
          console.error('Error fetching user event logs:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserEventLogs();
  }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }


  return (
    <View>
      <SafeAreaView edges={['top']} >
        <View className='flex-row justify-between items-center mx-5 mt-1'>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-full w-10 h-10 justify-center items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Octicons name="chevron-left" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className='mx-5 mt-4'>
        {events.map(({ eventData, eventLog }, index) => (
          <View key={index} style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{eventData?.name}</Text>
            <Text>Start Time: {formatTimestamp(eventData?.startTime)}</Text>
            <Text>End Time: {formatTimestamp(eventData?.endTime)}</Text>
            <Text>Total Points Earned: {eventLog?.points}</Text>
            <Text>Sign-In Time: {formatTimestamp(eventLog?.signInTime)}</Text>

            {eventLog?.signOutTime && (
              <Text>Sign-Out Time: {formatTimestamp(eventLog?.signOutTime)}</Text>
            )}
          </View>
        ))}
      </View>


    </View>

  )
}

const formatTimestamp = (timestamp: Timestamp | null | undefined) => {
  return timestamp ? new Date(timestamp.toDate()).toLocaleString() : 'N/A';
};

export default PersonalEventLog