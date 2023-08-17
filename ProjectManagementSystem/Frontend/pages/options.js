import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Link from "next/link";

function Opt_button({ props }) {
  return (
    <Link href={props.url}>
      <button>{props.name}</button>
    </Link>
  );
}

export default function Options() {
  const options = [
    {
      name: "Submit proposal",
      url: "/registered_user/create_proposal",
      key: "submit_proposal",
    },
    {
      name: "Guest Search",
      url: "nothing",
      key: "search_guest",
    },
    {
      name: "View Users",
      url: "/guest/view_users",
      key: "view_users",
    },
    {
      name: "View Resources",
      url: "/guest/view_resources",
      key: "view_resources",
    },
    {
      name: "View Proposals",
      url: "/guest/view_proposals",
      key: "view_proposals",
    },
    {
      name: "View Projects",
      url: "/guest/view_projects",
      key: "view_projects",
    },
    {
      name: "View Proposals for approval",
      url: "/admin/view_unapproved",
      key: "view_proposals_unapproved",
    },
  ];

  return (
    <div className={styles.option}>
      <center>
        <h1>Available Options</h1>
      </center>
      <ul>
        {options.map((opt) => {
          return <Opt_button className="text-10xl" props={opt} key={opt.key} />;
        })}
      </ul>
    </div>
  );
}
