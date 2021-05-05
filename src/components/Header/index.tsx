import styles from './header.module.scss';

export default function Header() {
  return (
    <header className={styles.Header}>
      <img src="/logo.svg" alt="logo" />
    </header>
  );
}
