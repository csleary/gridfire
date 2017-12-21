import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import DownloadButton from './DownloadButton';
import TransactionsList from './TransactionsList';
import '../style/download.css';

class Download extends Component {
  constructor(props) {
    super(props);
    this.state = {
      buttonClassName: '',
      buttonDisabled: false,
      buttonLabel: 'Check Payments',
      hasPaid: false,
      nemConnected: false,
      nemError: false,
      nemErrorMessage: '',
      nemNode: '',
      paymentToDate: 0,
      transactions: [],
      unconfirmed: []
    };
  }

  getIncomingTransactions = () => {
    this.setState({
      buttonClassName: 'disabled',
      buttonDisabled: true,
      buttonLabel: 'Listening for Payments',
      isCogVisible: true,
      transactions: [],
      unconfirmed: []
    });

    const endpoint = nem.model.objects.create('endpoint')(
      nem.model.nodes.defaultTestnet,
      nem.model.nodes.defaultPort
    );
    const websocket = nem.model.objects.create('endpoint')(
      nem.model.nodes.defaultTestnet,
      nem.model.nodes.websocketPort
    );
    const address = this.props.paymentAddress;
    const connector = nem.com.websockets.connector.create(websocket, address);

    let incomingTxs = [];
    let txId;
    const getTransactions = async () => {
      const tx = await nem.com.requests.account.transactions.incoming(
        endpoint,
        address,
        null,
        txId
      );
      txId = tx.data[tx.data.length - 1].meta.id;
      incomingTxs = [...incomingTxs, ...tx.data];
      const newTxs = this.filterTransactions(incomingTxs);
      this.setState(() => ({
        transactions: newTxs
      }));
      this.checkPayments();
      if (tx.data.length === 25) {
        getTransactions();
      }
    };
    getTransactions();

    connector.connect().then(
      () => {
        const node = connector.endpoint.host;
        const nodeDomain = node.split('//')[1];
        this.setState({
          nemConnected: true,
          nemNode: nodeDomain
        });

        nem.com.websockets.subscribe.account.transactions.confirmed(
          connector,
          (tx) => {
            const newTx = this.filterTransactions([tx]);
            const unconfirmed = this.state.unconfirmed;
            unconfirmed.pop();
            this.setState({
              transactions: [...newTx, ...this.state.transactions],
              unconfirmed
            });
            this.checkPayments();
          }
        );

        nem.com.websockets.subscribe.account.transactions.unconfirmed(
          connector,
          (tx) => {
            const unconTx = this.filterTransactions([tx]);
            this.setState({
              unconfirmed: [...unconTx, ...this.state.unconfirmed]
            });
          }
        );
      },
      (error) => {
        this.setState({
          nemError: true,
          nemErrorMessage: error
        });
      }
    );
  };

  filterTransactions = (txList) => {
    const newTxs = txList.filter(
      tx =>
        nem.utils.format.hexMessage({
          type: 1,
          payload: tx.transaction.message.payload
        }) === this.props.idHash
    );
    return newTxs;
  };

  checkPayments = () => {
    const recentPayments = [];
    this.state.transactions.map(payment =>
      recentPayments.push(payment.transaction.amount)
    );
    let sumPayments = recentPayments.reduce((acc, cur) => acc + cur, 0);
    sumPayments *= 10 ** -6;
    if (sumPayments >= this.props.price) {
      this.setState({ hasPaid: true });
    }
    this.setState({ paymentToDate: sumPayments.toFixed(2) });
  };

  render() {
    const downloadButton = (
      <div>
        <h3 className="text-center">Thank You!</h3>
        <DownloadButton />
      </div>
    );

    const confirmPaymentsIcon = this.state.buttonDisabled ? (
      <FontAwesome name="cog" spin className="button-icon" />
    ) : (
      <FontAwesome name="search" className="button-icon" />
    );

    const confirmPayments = (
      <div>
        <h3 className="text-center">Confirm Payments</h3>
        <button
          className={`btn btn-outline-primary btn-lg btn-block
            ${this.state.buttonClassName}`}
          onClick={this.getIncomingTransactions}
          disabled={this.state.buttonDisabled}
        >
          {this.state.buttonLabel}
          {confirmPaymentsIcon}
        </button>
      </div>
    );

    const transactionList = this.state.buttonDisabled && (
      <TransactionsList
        nemConnected={this.state.nemConnected}
        nemError={this.state.nemError}
        nemErrorMessage={this.state.nemErrorMessage}
        nemNode={this.state.nemNode}
        paymentToDate={this.state.paymentToDate}
        transactions={this.state.transactions}
        unconfirmed={this.state.unconfirmed}
      />
    );

    return (
      <div>
        {this.state.hasPaid ? downloadButton : confirmPayments}
        {transactionList}
      </div>
    );
  }
}

export default Download;
