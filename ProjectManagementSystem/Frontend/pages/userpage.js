import Head from "next/head";
import Image from "next/image";
import styles from "../../styles/Home.module.css";
import Header from "../header";
import { useRouter } from "next/router";
import useSWR from "swr";
import FullUser from "../../components/FullUserCard";
import loadingGif from "../../src/assets/loading.gif";

export default function User(props) {
  const fetcher = (url) => fetch(url).then((res) => res.json());
  const router = useRouter();
  const { data, error } = useSWR(router.query.data, fetcher);

  if (error) return <div>failed to load</div>;
  if (!data)
    return (
      <div
        style={{
          position: "relative",
          width: "175px",
          margin: "auto",
          transform: "translateY(110%)" /* or try 50% */,
        }}
      >
        <div>
          <img
            src={loadingGif.src}
            alt="wait until the page loads"
            height="100%"
          />
          <center>loading...</center>
        </div>
      </div>
    );
  // render data
  console.log(data);
  return (
    <div className={styles.container}>
      <Header></Header>
      <FullUser props={data[0]} />
    </div>
  );
}
