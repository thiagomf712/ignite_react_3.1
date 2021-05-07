import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import { useMemo } from 'react';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  timetoRead: number;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const postFormatted = useMemo(() => {
    const eachWordRegex = /[A-Za-z0-9áàâãéèêíïóôõöúçñÁÀÂÃÉÈÍÏÓÔÕÖÚÇÑ]+/g;

    const totalWords = post.data.content.reduce((words = 0, content) => {
      const wordsHeading = Array.from(
        content.heading.matchAll(eachWordRegex),
        match => match[0]
      );

      const wordsBody = Array.from(
        RichText.asText(content.body).matchAll(eachWordRegex),
        match => match[0]
      );

      return words + wordsHeading.length + wordsBody.length;
    }, 0);

    const contentHtml = post.data.content.map(content => {
      return {
        heading: content.heading,
        body: RichText.asHtml(content.body),
      };
    });

    return {
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
      timeToRead: Math.ceil(totalWords / 200),
      data: {
        title: post.data.title,
        banner: post.data.banner,
        author: post.data.author,
        content: contentHtml,
      },
    };
  }, [post]);

  if (router.isFallback) return <div>Carregando...</div>;

  return (
    <>
      <Head>
        <title>Space Traveling | {postFormatted.data.title}</title>
      </Head>

      <Header />

      <div className={styles.banner}>
        <img src={postFormatted.data.banner.url} alt="Banner" />
      </div>

      <div className={styles.post}>
        <header>
          <h2>{postFormatted.data.title}</h2>

          <div className={commonStyles.info}>
            <div>
              <FiCalendar />

              <time>{postFormatted.first_publication_date}</time>
            </div>

            <div>
              <FiUser />

              <p>{postFormatted.data.author}</p>
            </div>

            <div>
              <FiClock />

              <time>{postFormatted.timeToRead} min</time>
            </div>
          </div>
        </header>

        <div>
          {postFormatted.data.content.map(sections => (
            <div key={sections.heading} className={styles.postContent}>
              <h3>{sections.heading}</h3>

              <div
                className={styles.postContent}
                dangerouslySetInnerHTML={{ __html: sections.body }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 1,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 30, // 30 minutos;
  };
};
