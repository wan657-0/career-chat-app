class XFSparkAPI {
  constructor() {
    this.appId = '';
    this.apiKey = '';
    this.apiSecret = '';
    this.fullApiKey = '';
    this.httpBaseUrl = '/api-proxy/v2';
    this.wsBaseUrl = 'wss://maas-api.cn-huabei-1.xf-yun.com/v1.1/chat';
    this.defaultModel = 'xopqwen36v35b';
    this.wsConnection = null;
    this.wsCallbacks = {};
    this.demoMode = false;
    this.protocol = 'http';
  }

  setAuth(appId, apiKey, apiSecret) {
    this.appId = appId;
    console.log('setAuth called:', { appId, apiKey, apiSecret });
    if (apiKey.includes(':') && !apiSecret) {
      this.fullApiKey = apiKey;
      const parts = apiKey.split(':');
      this.apiKey = parts[0];
      this.apiSecret = parts[1];
      console.log('Parsed fullApiKey:', this.fullApiKey);
    } else {
      this.apiKey = apiKey;
      this.apiSecret = apiSecret;
      this.fullApiKey = `${apiKey}:${apiSecret}`;
      console.log('Constructed fullApiKey:', this.fullApiKey);
    }
  }

  setDemoMode(enabled) {
    this.demoMode = !!enabled;
  }

  isDemoMode() {
    return this.demoMode || !this.appId || !this.apiKey || !this.apiSecret;
  }

  setProtocol(protocol) {
    this.protocol = protocol === 'websocket' ? 'websocket' : 'http';
  }

  getProtocol() {
    return this.protocol;
  }

  setApiKey(apiKey) {
    const parts = apiKey.split(':');
    if (parts.length === 2) {
      this.appId = parts[0];
      this.apiSecret = parts[1];
      this.apiKey = apiKey;
    }
  }

  isDemoMode() {
    return this.demoMode || !this.appId || !this.apiKey || !this.apiSecret;
  }

  generateAuthHeader(method = 'POST', path = '/v2') {
    const dateStr = new Date().toUTCString();
    const signatureOrigin = `host: maas-api.cn-huabei-1.xf-yun.com\ndate: ${dateStr}\n${method} ${path} HTTP/1.1`;
    
    console.log('签名原始字符串:', JSON.stringify(signatureOrigin));
    
    return this.hmacSha256(signatureOrigin, this.apiSecret).then(signature => {
      const auth = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
      console.log('Authorization:', auth);
      return { auth, dateStr };
    });
  }

  generateBasicAuth() {
    const credentials = `${this.apiKey}:${this.apiSecret}`;
    const auth = `Basic ${btoa(credentials)}`;
    console.log('Basic Auth:', auth);
    return auth;
  }

  hmacSha256(data, key) {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(data);
    const keyBytes = encoder.encode(key);
    
    return crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(secretKey => {
      return crypto.subtle.sign('HMAC', secretKey, dataBytes);
    }).then(signature => {
      const uint8 = new Uint8Array(signature);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      return btoa(binary);
    });
  }

  // ========== 演示模式模拟数据 ==========
  getDemoResponse(prompt, options = {}) {
    const scene = options.scene || 'default';
    
    // 报告润色场景
    if (scene === 'polish' || prompt.includes('润色') || prompt.includes('专业')) {
      return {
        success: true,
        content: `【职业发展报告 - 专业润色版】

一、个人能力画像总结

该学员在专业技能方面表现突出，具备扎实的技术基础和良好的学习能力。在创新能力上展现出较强潜力，能够独立思考并解决实际问题。抗压能力和沟通表达能力处于中等水平，有进一步提升的空间。实习经验的积累为其职业发展奠定了实践基础。

综合竞争力评分：78/100

二、人岗匹配度分析

推荐岗位：前端开发工程师

经过AI智能分析，您与该岗位的匹配度达到85%，在基础要求、职业技能、职业素养和发展潜力四个维度上均有较好表现。

基础要求匹配度：82%
职业技能匹配度：88%
职业素养匹配度：75%
发展潜力匹配度：90%

三、职业目标设定

短期目标（1年内）：
• 深入掌握React/Vue等主流框架
• 考取前端工程师认证证书
• 积累2-3个完整项目经验

中期目标（3-5年）：
• 晋升为高级前端工程师
• 培养团队协作与项目管理能力
• 建立个人技术品牌影响力

四、行业趋势分析

当前前端开发领域呈现以下趋势：
• 跨平台开发框架（如React Native、Flutter）需求增长
• 前端工程化、模块化成为标配
• TypeScript使用率持续上升
• WebAssembly技术逐渐普及

五、分阶段行动计划

第一阶段（第1-6月）：基础夯实期
• 系统学习TypeScript高级特性
• 深入理解React源码架构
• 完成组件库开发实践

第二阶段（第7-18月）：能力提升期
• 掌握前端性能优化技术
• 学习前端安全最佳实践
• 主导中型项目开发

第三阶段（第19-36月）：职业晋升期
• 晋升为技术团队骨干
• 培养新人指导能力
• 参与技术架构决策`,
        isDemo: true
      };
    }
    
    // 个性化建议场景
    if (scene === 'suggestions' || prompt.includes('建议') || prompt.includes('差距')) {
      return {
        success: true,
        content: JSON.stringify({
          suggestions: [
            {
              dimension: '技能提升',
              priority: '高',
              content: '建议深入学习React和Vue框架，完成源码级别的理解，这将显著提升您的职业技能竞争力。'
            },
            {
              dimension: '证书获取',
              priority: '中',
              content: '建议考取软考程序员证书或前端工程师认证，这将增强您的基础要求匹配度。'
            },
            {
              dimension: '沟通能力',
              priority: '中',
              content: '建议积极参与团队项目协作，通过实际项目锻炼沟通表达能力和跨团队协调能力。'
            },
            {
              dimension: '实习经验',
              priority: '高',
              content: '建议争取更多实习机会，尤其是中型互联网公司的前端实习，这将为您提供宝贵的实战经验。'
            },
            {
              dimension: '创新思维',
              priority: '低',
              content: '建议养成技术博客写作习惯，定期总结项目经验和技术学习心得，培养创新思维习惯。'
            }
          ]
        }),
        isDemo: true
      };
    }
    
    // 行业趋势分析场景
    if (scene === 'industryTrend' || prompt.includes('行业趋势') || prompt.includes('发展趋势')) {
      const major = this.extractMajor(prompt);
      const trends = {
        info: {
          industry: '信息技术',
          growth: '上升',
          salary: '持续上涨，尤其是AI、大数据、云计算领域',
          outlook: '数字化转型推动行业高速发展，人才需求旺盛',
          skills: ['Java/Python/Go', '云原生', 'AI/ML', 'DevOps', '架构设计']
        },
        media: {
          industry: '数字媒体',
          growth: '稳定',
          salary: '短视频、内容创作领域薪资上涨',
          outlook: '短视频和直播电商持续发展，内容创作需求旺盛',
          skills: ['视频剪辑', '动效设计', 'UI/UX', '内容运营', '数据分析']
        },
        finance: {
          industry: '金融经济',
          growth: '上升',
          salary: '金融科技人才薪资涨幅明显',
          outlook: '金融科技、量化投资、数字货币领域快速发展',
          skills: ['金融建模', '数据分析', '风险控制', '区块链', 'Excel/Python']
        },
        marketing: {
          industry: '市场营销',
          growth: '稳定',
          salary: '数字营销人才薪资稳步增长',
          outlook: '数字化营销成为主流，私域运营增长迅速',
          skills: ['数字营销', '数据分析', '内容运营', 'SEO/SEM', '用户增长']
        },
        education: {
          industry: '教育人文',
          growth: '上升',
          salary: '在线教育、职业教育领域薪资上涨',
          outlook: '终身学习理念普及，在线教育持续增长',
          skills: ['课程设计', '教学法', '内容创作', '在线运营', '数据分析']
        },
        engineering: {
          industry: '工程制造',
          growth: '稳定',
          salary: '技术工人短缺，高级工程师薪资上涨',
          outlook: '智能制造、新能源汽车带来新机遇',
          skills: ['CAD/SolidWorks', '精益生产', '项目管理', '质量控制', '自动化']
        },
        medicine: {
          industry: '生物医药',
          growth: '上升',
          salary: '创新药研发人才紧缺，薪资涨幅领先',
          outlook: '创新药、生物技术、医疗器械领域高速发展',
          skills: ['药物研发', '临床监查', 'GMP', '数据分析', '法规知识']
        },
        law: {
          industry: '法律公共',
          growth: '稳定',
          salary: '合规、知识产权领域薪资上涨',
          outlook: '企业合规需求增加，知识产权保护意识增强',
          skills: ['法律研究', '合同审核', '合规审计', '知识产权', '公文写作']
        }
      };
      
      const trend = trends[major] || trends.info;
      return {
        success: true,
        content: JSON.stringify({
          industry: trend.industry,
          growth: trend.growth,
          salaryTrend: trend.salary,
          futureOutlook: trend.outlook,
          keySkills: trend.skills
        }),
        isDemo: true
      };
    }
    
    // 能力画像分析场景
    if (scene === 'abilityProfile' || prompt.includes('能力画像') || prompt.includes('竞争力')) {
      return {
        success: true,
        content: JSON.stringify({
          abilities: {
            skills: 4,
            certificates: 3,
            innovation: 3,
            learning: 4,
            stress: 3,
            communication: 3,
            internship: 3
          },
          completeness: {
            basic: true,
            skills: true,
            certificates: true,
            abilities: true
          },
          competitiveness: 78,
          strengths: ['技术学习能力强', '专业基础扎实', '有项目实战经验'],
          weaknesses: ['沟通表达能力需提升', '证书数量偏少', '实习经验不足'],
          suggestions: ['建议多参与团队协作项目', '考取行业相关证书', '积累更多实习经验']
        }),
        isDemo: true
      };
    }
    
    // 人岗匹配场景
    if (scene === 'match' || prompt.includes('匹配度')) {
      return {
        success: true,
        content: JSON.stringify({
          dimensions: {
            basic: { score: 82, analysis: '您的学历和专业背景符合岗位基本要求，证书方面还有提升空间。' },
            professional: { score: 88, analysis: '您的专业技能与岗位要求高度匹配，尤其在前端技术栈方面表现突出。' },
            quality: { score: 75, analysis: '您的职业素养处于中等水平，沟通能力和抗压能力需要进一步培养。' },
            potential: { score: 90, analysis: '您的学习能力和创新潜力非常出色，具备良好的职业发展前景。' }
          },
          overall: 85,
          matchLevel: '较好匹配',
          gapAnalysis: '主要差距在于沟通表达能力和相关证书数量，建议在在校期间多参与团队项目协作。',
          improvementSuggestions: [
            '考取前端工程师认证证书',
            '参与更多团队协作项目',
            '提升公共演讲和表达能力'
          ]
        }),
        isDemo: true
      };
    }
    
    // 默认回复
    return {
      success: true,
      content: `感谢您的咨询！作为职业规划智能助手，我可以为您提供：

1. 职业能力评估与分析
2. 人岗匹配度计算
3. 职业发展路径规划
4. 行业趋势分析
5. 个性化发展建议

请告诉我您具体想了解哪方面的信息，我将为您提供专业的解答。`,
      isDemo: true
    };
  }

  extractMajor(prompt) {
    const majors = ['info', 'media', 'finance', 'marketing', 'education', 'engineering', 'medicine', 'law'];
    const majorNames = {
      info: ['信息技术', '计算机', 'IT', '前端', '后端', '开发'],
      media: ['数字媒体', '设计', 'UI', 'UX', '视频', '媒体'],
      finance: ['金融', '银行', '投资', '会计', '经济'],
      marketing: ['营销', '市场', '商务', '品牌', '销售'],
      education: ['教育', '教师', '培训', '人力', 'HR'],
      engineering: ['工程', '制造', '机械', '项目', '生产'],
      medicine: ['医药', '医疗', '生物', '制药', '健康'],
      law: ['法律', '合规', '律师', '公务员', '公共']
    };
    
    for (const major of majors) {
      const names = majorNames[major] || [];
      for (const name of names) {
        if (prompt.includes(name)) return major;
      }
    }
    return 'info'; // 默认返回信息技术
  }

  async generateText(prompt, options = {}) {
    // 演示模式
    if (this.isDemoMode()) {
      console.log('【演示模式】使用模拟数据');
      return this.getDemoResponse(prompt, options);
    }

    // 根据协议选择调用方式
    if (this.protocol === 'websocket') {
      return this.generateTextWebSocket(prompt, options);
    } else {
      try {
        return await this.generateTextHTTP(prompt, options);
      } catch (error) {
        // HTTP请求失败（可能是CORS问题），尝试WebSocket
        if (error.message.includes('fetch') || error.message.includes('CORS')) {
          console.warn('HTTP请求失败，尝试WebSocket协议...');
          return this.generateTextWebSocket(prompt, options);
        }
        throw error;
      }
    }
  }

  async generateTextHTTP(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 2048,
      temperature = 0.8,
      topP = 0.8
    } = options;

    console.log('generateTextHTTP called, fullApiKey:', this.fullApiKey ? 'SET' : 'NOT SET');
    if (this.fullApiKey) {
      console.log('fullApiKey value:', this.fullApiKey.substring(0, 20) + '...');
    }

    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP
    };

    console.log('Request body:', JSON.stringify(requestBody));

    // 重试配置
    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (attempt > 0) {
        const waitTime = 15000; // 等待15秒
        console.log(`第${attempt + 1}次重试，等待${waitTime/1000}秒...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      try {
        const requestUrl = `${this.httpBaseUrl}/chat/completions`;
        
        console.log(`Request URL (尝试${attempt + 1}/${maxRetries}):`, requestUrl);
        
        const headers = {
          'Content-Type': 'application/json',
          'X-API-Key': this.fullApiKey
        };
        
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });

        console.log('响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          let errorMessage = '';
          if (errorData) {
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error && errorData.error.message) {
              errorMessage = errorData.error.message;
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          } else {
            errorMessage = 'HTTP错误: ' + response.status + ' ' + response.statusText;
          }
          console.error('API错误:', errorData);
          
          // 检查是否是QPS超限错误
          if (errorMessage.includes('QpsOverFlow') || errorMessage.includes('qps')) {
            console.warn('QPS超限，准备重试...');
            lastError = new Error('API请求失败: ' + errorMessage);
            continue; // 继续重试
          }
          
          throw new Error('API请求失败: ' + errorMessage);
        }

        const data = await response.json();
        console.log('响应数据:', data);

        if (!data || !data.choices || data.choices.length === 0) {
          throw new Error('API响应格式错误');
        }

        const assistantReply = data.choices[0].message;
        
        if (!assistantReply) {
          throw new Error('未收到助手回复');
        }

        return {
          success: true,
          content: assistantReply.content || '',
          usage: data.usage || null,
          model: model
        };

      } catch (error) {
        console.error(`请求异常 (尝试${attempt + 1}):`, error);
        lastError = error;
        
        // 如果不是QPS错误，直接抛出
        if (!error.message.includes('QpsOverFlow') && !error.message.includes('qps')) {
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('网络请求失败，请检查网络连接或代理设置');
          }
          throw error;
        }
      }
    }

    // 所有重试都失败了
    if (lastError) {
      // 提供友好的错误信息
      if (lastError.message.includes('QpsOverFlow')) {
        throw new Error('API调用频率超限，请稍后再试（建议等待30秒以上）');
      }
      throw lastError;
    }
    
    throw new Error('请求失败，已达到最大重试次数');
  }

  async generateTextWebSocket(prompt, options = {}) {
    const {
      model = this.defaultModel,
      maxTokens = 2048,
      temperature = 0.8,
      topP = 0.8
    } = options;

    return new Promise((resolve, reject) => {
      let fullContent = '';
      let usage = null;
      let hasError = false;
      let timeoutTimer = null;

      const cleanup = () => {
        clearTimeout(timeoutTimer);
        if (this.wsConnection) {
          this.wsConnection.onopen = null;
          this.wsConnection.onmessage = null;
          this.wsConnection.onerror = null;
          this.wsConnection.onclose = null;
          if (this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.close(1000);
          }
          this.wsConnection = null;
        }
      };

      const handleError = (error) => {
        hasError = true;
        cleanup();
        reject(error);
      };

      const onMessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket消息:', data);
          
          const header = data.header;
          const code = header?.code || -1;
          
          if (code !== 0) {
            handleError(new Error(`WebSocket错误: ${header?.message || '未知错误'} (code: ${code})`));
            return;
          }

          const textList = data.payload?.message?.text || [];
          textList.forEach(item => {
            if (item.role === 'assistant' && item.content) {
              fullContent += item.content;
            }
          });

          if (data.payload?.usage) {
            usage = data.payload.usage;
          }

          const status = header?.status;
          if (status === 2) {
            cleanup();
            resolve({
              success: true,
              content: fullContent,
              usage: usage,
              model: model
            });
          }
        } catch (e) {
          handleError(new Error('解析WebSocket消息失败: ' + e.message));
        }
      };

      const onError = (event) => {
        const errorMsg = event.message || 'WebSocket连接错误';
        console.error('WebSocket错误事件:', event);
        handleError(new Error(errorMsg));
      };

      const onClose = (event) => {
        console.log('WebSocket关闭事件:', event);
        if (!hasError) {
          if (event.code === 1000) {
            if (fullContent) {
              resolve({
                success: true,
                content: fullContent,
                usage: usage,
                model: model
              });
            } else {
              reject(new Error('WebSocket连接已关闭，未收到回复'));
            }
          } else {
            reject(new Error(`WebSocket连接异常关闭 (code: ${event.code}, reason: ${event.reason || '未知'})`));
          }
        }
        cleanup();
      };

      this.connectWebSocket(onMessage, onError, onClose).then(() => {
        timeoutTimer = setTimeout(() => {
          if (!hasError) {
            handleError(new Error('WebSocket请求超时（30秒）'));
          }
        }, 30000);

        const sendMessage = () => {
          if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.sendWebSocketMessage(prompt, options);
          } else if (this.wsConnection && this.wsConnection.readyState === WebSocket.CONNECTING) {
            setTimeout(sendMessage, 100);
          } else {
            handleError(new Error('WebSocket连接未建立'));
          }
        };
        sendMessage();
      }).catch(err => {
        handleError(new Error('WebSocket连接失败: ' + err.message));
      });
    });
  }

  async chat(messages, options = {}) {
    if (this.isDemoMode()) {
      const lastMessage = messages[messages.length - 1]?.content || '';
      return this.getDemoResponse(lastMessage, { ...options, scene: 'default' });
    }

    const {
      model = this.defaultModel,
      maxTokens = 2048,
      temperature = 0.8,
      topP = 0.8
    } = options;

    const requestBody = {
      header: {
        app_id: this.appId,
        uid: 'user_' + Date.now()
      },
      parameter: {
        chat: {
          domain: model,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens
        }
      },
      payload: {
        message: {
          text: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      }
    };

    try {
      const requestUrl = `${this.httpBaseUrl}/chat/completions`;
      
      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.fullApiKey
      };
      
      console.log('chat请求URL:', requestUrl);
      console.log('chat请求头:', headers);
      
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      console.log('chat响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        let errorMessage = '';
        if (errorData) {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        } else {
          errorMessage = 'HTTP错误: ' + response.status + ' ' + response.statusText;
        }
        throw new Error('API请求失败: ' + errorMessage);
      }

      const data = await response.json();
      console.log('chat响应数据:', data);

      if (!data || !data.payload || !data.payload.message) {
        throw new Error('API响应格式错误');
      }

      const textList = data.payload.message.text || [];
      const assistantReply = textList.find(item => item.role === 'assistant');
      
      if (!assistantReply) {
        throw new Error('未收到助手回复');
      }

      return {
        success: true,
        content: assistantReply.content || '',
        role: 'assistant',
        usage: data.payload.usage || null,
        model: model
      };

    } catch (error) {
      console.error('chat请求异常:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('网络请求失败，请检查网络连接');
      }
      throw error;
    }
  }

  // ========== 职业规划专用场景方法 ==========

  // 报告润色
  async polishReport(reportContent) {
    const prompt = `请将以下职业发展报告进行专业润色，使语言更加专业、流畅、有条理。保持原有的结构和格式，只优化语言表达：

${reportContent}

请直接返回润色后的完整报告内容，不要添加其他说明。`;

    return this.generateText(prompt, { scene: 'polish', temperature: 0.6, maxTokens: 4096 });
  }

  // 个性化建议生成
  async generateSuggestions(userProfile, jobProfile, gapData) {
    const prompt = `基于以下信息，生成3-5条个性化职业发展建议：

用户画像：
${JSON.stringify(userProfile, null, 2)}

岗位画像：
${JSON.stringify(jobProfile, null, 2)}

差距分析：
${JSON.stringify(gapData, null, 2)}

请生成JSON格式的建议：
{
  "suggestions": [
    {"dimension": "维度", "priority": "高/中/低", "content": "具体建议内容"}
  ]
}`;

    return this.generateText(prompt, { scene: 'suggestions', temperature: 0.7, maxTokens: 2048 });
  }

  // 行业趋势分析
  async analyzeIndustryTrend(majorCategory) {
    const majorNames = {
      info: '信息技术',
      media: '数字媒体',
      finance: '金融经济',
      marketing: '市场营销',
      education: '教育人文',
      engineering: '工程制造',
      medicine: '生物医药',
      law: '法律公共'
    };

    const prompt = `请分析${majorNames[majorCategory] || majorCategory}行业当前的发展趋势、薪资水平和未来前景。

请生成JSON格式：
{
  "industry": "行业名称",
  "growth": "上升/稳定/下降",
  "salaryTrend": "薪资趋势描述",
  "futureOutlook": "未来展望",
  "keySkills": ["关键技能1", "关键技能2", "关键技能3"]
}`;

    return this.generateText(prompt, { scene: 'industryTrend', temperature: 0.7, maxTokens: 2048 });
  }

  // 能力画像分析
  async analyzeAbilityProfile(userData) {
    const prompt = `请分析以下学生就业能力数据，生成能力画像评分和分析建议：

${JSON.stringify(userData, null, 2)}

请生成JSON格式：
{
  "abilities": {
    "skills": 1-5分数,
    "certificates": 1-5分数,
    "innovation": 1-5分数,
    "learning": 1-5分数,
    "stress": 1-5分数,
    "communication": 1-5分数,
    "internship": 1-5分数
  },
  "completeness": {
    "basic": true/false,
    "skills": true/false,
    "certificates": true/false,
    "abilities": true/false
  },
  "competitiveness": 0-100分数,
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["短板1", "短板2", "短板3"],
  "suggestions": ["建议1", "建议2", "建议3"]
}`;

    return this.generateText(prompt, { scene: 'abilityProfile', temperature: 0.7, maxTokens: 2048 });
  }

  // 人岗匹配分析
  async calculateMatchAnalysis(userProfile, jobProfile) {
    const prompt = `请分析用户画像与岗位的匹配度：

用户画像：
${JSON.stringify(userProfile, null, 2)}

岗位画像：
${JSON.stringify(jobProfile, null, 2)}

请从基础要求、职业技能、职业素养、发展潜力四个维度分析，返回JSON：
{
  "dimensions": {
    "basic": {"score": 0-100, "analysis": "分析"},
    "professional": {"score": 0-100, "analysis": "分析"},
    "quality": {"score": 0-100, "analysis": "分析"},
    "potential": {"score": 0-100, "analysis": "分析"}
  },
  "overall": 0-100总分,
  "matchLevel": "非常匹配/较好匹配/一般匹配/较差匹配",
  "gapAnalysis": "差距分析",
  "improvementSuggestions": ["建议1", "建议2", "建议3"]
}`;

    return this.generateText(prompt, { scene: 'match', temperature: 0.7, maxTokens: 2048 });
  }

  // 生涯报告生成
  async generateCareerReport(userProfile, matchResult, industryTrend) {
    const prompt = `请为学生生成完整的职业生涯发展报告：

学生画像：
${JSON.stringify(userProfile, null, 2)}

匹配分析：
${JSON.stringify(matchResult, null, 2)}

行业趋势：
${JSON.stringify(industryTrend, null, 2)}

请生成完整的职业发展报告，包含：个人能力画像、人岗匹配分析、职业目标设定（短期/中期/长期）、行业趋势分析、分阶段行动计划。

报告应该专业、详细、可执行性强。`;

    return this.generateText(prompt, { scene: 'report', temperature: 0.7, maxTokens: 4096 });
  }

  // ========== WebSocket方法 ==========
  async connectWebSocket(onMessage, onError, onClose) {
    if (this.isDemoMode()) {
      console.log('【演示模式】WebSocket不可用');
      if (onError) onError(new Error('演示模式下不支持WebSocket'));
      return;
    }

    if (!this.appId || !this.apiKey || !this.apiSecret) {
      throw new Error('请先设置认证信息');
    }

    try {
      const wsUrl = await this.generateWebSocketUrl();
      
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('WebSocket连接已建立');
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          if (onError) {
            onError(new Error('解析WebSocket消息失败: ' + e.message));
          }
        }
      };

      this.wsConnection.onerror = (event) => {
        const errorMsg = event.message || 'WebSocket连接错误';
        console.error('WebSocket错误:', event);
        if (onError) {
          onError(new Error(errorMsg));
        }
      };

      this.wsConnection.onclose = (event) => {
        console.log('WebSocket关闭:', event.code, event.reason);
        if (event.code !== 1000 && !hasError) {
          const closeMsg = `WebSocket连接关闭 (code: ${event.code}, reason: ${event.reason || '未知'})`;
          console.error(closeMsg);
        }
        if (onClose) {
          onClose(event);
        }
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  async generateWebSocketUrl() {
    const host = 'maas-api.cn-huabei-1.xf-yun.com';
    const path = '/v1.1/chat';
    const url = `wss://${host}${path}`;
    const dateStr = new Date().toUTCString();
    
    // 生成签名原始字符串 - 使用\n分隔（与HTTP一致）
    const signatureOrigin = `host: ${host}\ndate: ${dateStr}\nGET ${path} HTTP/1.1`;
    
    console.log('WebSocket签名原始字符串:', JSON.stringify(signatureOrigin));
    
    // HMAC-SHA256签名 - hmacSha256已返回Base64
    const signature = await this.hmacSha256(signatureOrigin, this.apiSecret);
    
    console.log('WebSocket签名:', signature);
    
    // 构造认证字符串
    const authorization = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    
    console.log('WebSocket Authorization:', authorization);
    
    // URL参数 - authorization需要Base64编码
    const params = new URLSearchParams({
      authorization: btoa(authorization),
      date: dateStr,
      host: host
    });
    
    const wsUrl = `${url}?${params.toString()}`;
    console.log('WebSocket URL:', wsUrl);
    
    return wsUrl;
  }

  sendWebSocketMessage(prompt, options = {}) {
    if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket连接未建立');
    }

    const {
      model = this.defaultModel,
      maxTokens = 2048,
      temperature = 0.8,
      topP = 0.8
    } = options;

    const message = {
      header: {
        app_id: this.appId,
        uid: 'user_' + Date.now()
      },
      parameter: {
        chat: {
          domain: model,
          temperature: temperature,
          top_p: topP,
          max_tokens: maxTokens
        }
      },
      payload: {
        message: {
          text: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }
      }
    };

    this.wsConnection.send(JSON.stringify(message));
  }

  closeWebSocket() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  validateAuth(appId, apiKey, apiSecret) {
    return appId && apiKey && apiSecret && 
           typeof appId === 'string' && 
           typeof apiKey === 'string' && 
           typeof apiSecret === 'string';
  }

  getAvailableModels() {
    return [
      { id: 'xopqwen36v35b', name: 'Qwen3.6-35B', description: '通义千问3.6 35B大模型，高性能' },
      { id: 'xop3qwen1b7', name: 'Qwen3-1.7B', description: '通义千问3 1.7B小模型，响应快' }
    ];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = XFSparkAPI;
}
