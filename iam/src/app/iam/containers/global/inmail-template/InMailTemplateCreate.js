import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Select, Form, Input, Popover, Icon } from 'choerodon-ui';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { axios, Content, Header, Page } from 'choerodon-front-boot';
import InmailTemplateStore from '../../../stores/global/inmail-template';
import './InMailTemplate.scss';
import Editor from '../../../components/editor';

const FormItem = Form.Item;
const Option = Select.Option;

class MailTemplateType {
  constructor(context) {
    this.context = context;
    const { AppState } = this.context.props;
    this.data = AppState.currentMenuType;
    const { type, id, name } = this.data;
    const codePrefix = type === 'organization' ? 'organization' : 'global';
    this.code = `${codePrefix}.inmailtemplate`;
    this.values = { name: name || 'Choerodon' };
    this.type = type;
    this.orgId = id;
    this.orgName = name;
  }
}

@Form.create()
@withRouter
@injectIntl
@inject('AppState')
@observer
export default class InMailTemplateCreate extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.initMailTemplate();
    if (!InmailTemplateStore.getTemplateType.length) {
      this.loadTemplateType();
    }
  }

  componentDidMount() {
    if (InmailTemplateStore.getCurrentDetail.content) {
      this.setState({
        editorContent: InmailTemplateStore.getCurrentDetail.content,
      });
    }
  }

  componentWillUnmount() {
    InmailTemplateStore.setSelectType('create');
    InmailTemplateStore.setCurrentDetail({});
  }

  getInitState() {
    return {
      editorContent: null,
    };
  }

  initMailTemplate() {
    this.mail = new MailTemplateType(this);
  }

  loadTemplateType = () => {
    InmailTemplateStore.loadTemplateType(this.mail.type, this.mail.orgId).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        InmailTemplateStore.setTemplateType(data);
      }
    });
  }

  /**
   * 模板编码校验
   * @param rule 表单校验规则
   * @param value 模板编码
   * @param callback 回调函数
   */
  checkCode = (rule, value, callback) => {
    const { intl } = this.props;
    axios.post('notify/v1/notices/letters/templates/check', value).then((mes) => {
      if (mes.failed) {
        callback(intl.formatMessage({ id: 'inmailtemplate.code.exist' }));
      } else {
        callback();
      }
    });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { intl } = this.props;
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        const pattern = /^((<[^(>|img)]+>)*\s*)*$/g;
        // 判断富文本编辑器是否为空
        if (this.state.editorContent && (!pattern.test(this.state.editorContent))) {
          this.setState({
            isSubmitting: true,
          });
          this.handleSave(values);
        } else {
          Choerodon.prompt(intl.formatMessage({ id: 'inmailtemplate.mailcontent.required' }));
        }
      }
    });
  }

  handleSave = (values) => {
    const { intl } = this.props;
    const { type, orgId } = this.mail;
    const body = {
      ...values,
      content: this.state.editorContent,
      isPredefined: true,
    };
    InmailTemplateStore.createTemplate(body, type, orgId).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        Choerodon.prompt(intl.formatMessage({ id: 'create.success' }));
        this.goBack();
      }
      this.setState({
        isSubmitting: false,
      });
    }).catch((error) => {
      Choerodon.handleResponseError(error);
      this.setState({
        isSubmitting: false,
      });
    });
  }

  goBack = () => {
    this.props.history.push('/iam/inmail-template');
  }


  renderContent = () => {
    const { intl } = this.props;
    const selectType = InmailTemplateStore.selectType;
    const { getFieldDecorator } = this.props.form;
    const { isSubmitting } = this.state;
    const inputWidth = 512;
    const tip = (
      <div className="c7n-mailcontent-icon-container-tip">
        <FormattedMessage id="mailtemplate.mailcontent.tip" />
        <a href={intl.formatMessage({ id: 'mailtemplate.mailcontent.tip.link' })} target="_blank">
          <span>{intl.formatMessage({ id: 'learnmore' })}</span>
          <Icon type="open_in_new" style={{ fontSize: '13px' }} />
        </a>
      </div>
    );

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      },
    };
    return (
      <Form className="c7n-mailtemplate-create-form">
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('code', {
            rules: [{
              required: true,
              whitespace: true,
              message: intl.formatMessage({ id: 'inmailtemplate.code.required' }),
            }, {
              validator: this.checkCode,
            }],
            validateTrigger: 'onBlur',
            validateFirst: true,
          })(
            <Input autoComplete="off" style={{ width: inputWidth }} label={<FormattedMessage id="inmailtemplate.code" />} />,
          )
          }
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('name', {
            rules: [{
              required: true,
              whitespace: true,
              message: intl.formatMessage({ id: 'inmailtemplate.name.required' }),
            }],
          })(
            <Input autoComplete="off" style={{ width: inputWidth }} label={<FormattedMessage id="inmailtemplate.name" />} />,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          {getFieldDecorator('type', {
            rules: [{
              required: true,
              message: intl.formatMessage({ id: 'inmailtemplate.type.required' }),
            }],
            initialValue: InmailTemplateStore.getCurrentDetail.type || undefined,
          })(
            <Select
              getPopupContainer={() => document.getElementsByClassName('page-content')[0]}
              label={<FormattedMessage id="inmailtemplate.table.mailtype" />}
              style={{ width: inputWidth }}
              disabled={selectType !== 'create'}
            >
              {
                InmailTemplateStore.templateType.length && InmailTemplateStore.templateType.map(({ name, id, code }) => (
                  <Option key={id} value={code}>{name}</Option>
                ))
              }
            </Select>,
          )}
        </FormItem>
        <FormItem
          {...formItemLayout}
        >
          {
            getFieldDecorator('title', {
              rules: [{
                required: true,
                whitespace: true,
                message: intl.formatMessage({ id: 'inmailtemplate.title.required' }),
              }],
              initialValue: InmailTemplateStore.getCurrentDetail.title || undefined,
            })(
              <Input autoComplete="off" style={{ width: inputWidth }} label={<FormattedMessage id="inmailtemplate.title" />} />,
            )
          }

        </FormItem>
        <div style={{ marginBottom: '8px' }}>
          <div className="c7n-mailcontent-icon-container">
            <span className="c7n-mailcontent-label">{intl.formatMessage({ id: 'inmailtemplate.mail.content' })}</span>
            <Popover
              getPopupContainer={() => document.getElementsByClassName('page-content')[0]}
              placement="right"
              trigger="hover"
              content={tip}
              overlayStyle={{ maxWidth: '380px' }}
            >
              <Icon type="help" />
            </Popover>
          </div>
          <Editor
            value={this.state.editorContent}
            onRef={(node) => {
              this.editor = node;
            }}
            onChange={(value) => {
              this.setState({
                editorContent: value,
              });
            }}
          />
        </div>
        <div className="divider" />
        <div className="btn-group">
          <Button
            funcType="raised"
            type="primary"
            loading={isSubmitting}
            onClick={this.handleSubmit}
          >
            <FormattedMessage id="create" />
          </Button>
          <Button
            funcType="raised"
            onClick={this.goBack}
            disabled={isSubmitting}
            style={{ color: '#3F51B5' }}
          >
            <FormattedMessage id="cancel" />
          </Button>
        </div>
      </Form>
    );
  }

  render() {
    return (
      <Page>
        <Header
          title={<FormattedMessage id="inmailtemplate.create" />}
          backPath={'/iam/inmail-template'}
        />
        <Content
          code={`${this.mail.code}.create`}
          values={this.mail.values}
        >
          {this.renderContent()}
        </Content>
      </Page>
    );
  }
}
