import { GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import Link from 'next/link';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCallback, useState } from 'react';
import { getPrismicClient } from '../services/prismic';

// import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface IPost {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

type IPostPagination = { next_page: string; results: IPost[] };

type IHomeProps = { postsPagination: IPostPagination };

type IPostResult = { next_page: string | null; results: IPost[] };

export default function Home({ postsPagination }: IHomeProps) {
  const [posts, setPosts] = useState<IPost[]>(() => {
    return postsPagination.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    }));
  });
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  const handleNextPage = useCallback(async () => {
    const response: IPostResult = await (await fetch(nextPage)).json();

    const formattedPosts = response.results.map(post => ({
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    }));

    setPosts([...posts, ...formattedPosts]);
    setNextPage(response.next_page);
  }, [nextPage, posts]);

  return (
    <>
      <Head>
        <title>Space Traveling</title>
      </Head>

      <main className={styles.Container}>
        <img src="/logo.svg" alt="logo" />

        {posts.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h2>{post.data.title}</h2>

              <h3>{post.data.subtitle}</h3>

              <div>
                <div>
                  <FiCalendar />

                  <time>{post.first_publication_date}</time>
                </div>

                <div>
                  <FiUser />

                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}

        {nextPage && (
          <button onClick={handleNextPage} type="button">
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  // const posts = response.results.map<IPost>(post => {
  //   return {
  //     uid: post.uid,
  //     first_publication_date: format(
  //       new Date(post.first_publication_date),
  //       'dd MMM yyyy',
  //       { locale: ptBR }
  //     ),
  //     data: post.data,
  //   };
  // });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: response.results,
      },
    },
    revalidate: 60 * 60 * 12, // 12 horas
  };
};
