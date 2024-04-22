import { View, Text, TouchableOpacity } from 'react-native'
import React, { useCallback, useContext, useState } from 'react'
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeDrawerParams, MembersScreenRouteProp } from '../../types/Navigation';
import { Octicons, FontAwesome } from '@expo/vector-icons';
import { getUpcomingEvents, getPastEvents, queryUserEventLogs } from '../../api/firebaseUtils';
import { SHPEEvent } from '../../types/Events';
import EventsList from '../../components/EventsList';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { UserContext } from '../../context/UserContext';
import { auth } from '../../config/firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';


const PersonalEventLog = ( {navigation}: NativeStackScreenProps<HomeDrawerParams> ) => {
  const [pastEvents, setPastEvents] = useState<SHPEEvent[]>([]);
  const [pastUserEventsData, setPastUserEventsData] =  useState<SHPEEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [initialFetch, setInitialFetch] = useState(false);
  const [initialPastFetch, setInitialPastFetch] = useState(false);
  const userContext = useContext(UserContext);
  const { userInfo } = userContext!;

  const hasPrivileges = (userInfo?.publicInfo?.roles?.admin?.valueOf() || userInfo?.publicInfo?.roles?.officer?.valueOf() || userInfo?.publicInfo?.roles?.developer?.valueOf());

  useFocusEffect(
    useCallback(() => {
        const fetchEvents = async () => {
            try {
                setIsLoading(true);

                const upcomingEventsData = await getUpcomingEvents();
                const pastEventsData = await getPastEvents(5);
                const pastUserEventsData = await queryUserEventLogs(auth.currentUser?.uid!);

                // Filter to separate current and upcoming events
                // const currentTime = new Date();
                // const currentEvents = upcomingEventsData.filter(event => {
                //     const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                //     const endTime = event.endTime ? event.endTime.toDate() : new Date(0);
                //     return startTime <= currentTime && endTime >= currentTime;
                // });
                // const trueUpcomingEvents = upcomingEventsData.filter(event => {
                //     const startTime = event.startTime ? event.startTime.toDate() : new Date(0);
                //     return startTime > currentTime;
                // });

                // if (trueUpcomingEvents) {
                //     setUpcomingEvents(trueUpcomingEvents);
                // }

                if (pastEventsData) {
                    setPastEvents(pastEventsData);
                }

                if (pastUserEventsData) {
                  setPastUserEventsData(pastUserEventsData);
                }

                // Assuming you have a state setter for current events
                // setCurrentEvents(currentEvents);

                setIsLoading(false);
            } catch (error) {
                console.error('An error occurred while fetching events:', error);
                setIsLoading(false);
            }
        };

        // Only fetch events if initial fetch has not been done or if user has privileges
        // A user with privileges will need to see the event they just created/edited
        if (!initialFetch || hasPrivileges) {
            fetchEvents();
            setInitialFetch(true);
        }
    }, [hasPrivileges, initialFetch])
);

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
        {(!isLoading && pastEvents.length != 0) &&
          <>
              <Text className='text-xl mb-2 font-bold text-center'>Personal Events Log</Text>
              <EventsList
                 events={pastUserEventsData}
                 navigation={navigation}
              />
          </>
        }
      </View>
    </View>
    
  )
}

export default PersonalEventLog