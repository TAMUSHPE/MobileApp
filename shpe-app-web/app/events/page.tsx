import Navbar from "../components/Navbar";
import Header from "../components/Header";

const Page = () => {
  return (
     <div className= 'bg-white flex h-screen w-screen'>
        <Navbar />
        <Header title="Event Management" iconPath="calendar-solid-gray.svg"/>
      </div>
  );
}

export default Page;