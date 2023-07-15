import { Images } from '../../assets';
import { Slide } from '../types/Slide';

export const slides: Slide[] = [
    {
        id: 1,
        title: "Event 1",
        image: Images.CAROUSEL_1,
        type: "event",
        description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Nullam id dolor id nibh ultricies vehicula ut id elit."
    },
    {
        id: 2,
        title: "Event 2",
        image: Images.CAROUSEL_2,
        type: "event",
        description: "lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Nullam id dolor id nibh ultricies vehicula ut id elit."
    },
    {
        id: 3,
        title: "Member",  // Member Name
        image: Images.CAROUSEL_3,
        type: "member",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla vitae elit libero, a pharetra augue. Nullam id dolor id nibh ultricies vehicula ut id elit."
    }
];
