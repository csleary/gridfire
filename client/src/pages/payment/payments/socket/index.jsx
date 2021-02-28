import React from 'react';
import TextSpinner from 'components/textSpinner';
import styles from './socket.module.css';

const Socket = () => {
  return (
    <div className={styles.root}>
      <TextSpinner type="nemp3" speed={0.005} className={styles.spinner} />
      Listening for transactions
    </div>
  );
};

export default Socket;
