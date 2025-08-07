import * as XLSX from 'xlsx';
import { checkDataQuality, cleanAndStandardizeData } from './analyzeExcelData';

// 从EmployeeNotes页面复制的ImportData接口
export interface ImportData {
  // 基础信息
  publish_time: string | null;
  note_source: string | null;
  note_type: string | null;
  note_title: string | null;
  note_id: string;
  note_link: string | null;
  creator_name: string | null;
  creator_id: string | null;
  follower_count: number | null;
  note_status: string | null;
  custom_tags: string | null;
  product_binding_status: string | null;
  blogger_category: string | null;
  blogger_quotation: number | null;
  service_fee: number | null;
  content_tags: string | null;
  is_promoted: string | null;
  employee_region: string | null;
  employee_name: string | null;
  
  // 地域分布字段
  region_province_top1: string | null;
  region_province_top2: string | null;
  region_province_top3: string | null;
  region_city_top1: string | null;
  region_city_top2: string | null;
  region_city_top3: string | null;
  user_interest_top1: string | null;
  user_interest_top2: string | null;
  user_interest_top3: string | null;
  
  // 基础流量字段
  read_uv: number | null;
  like_count: number | null;
  comment_count: number | null;
  collect_count: number | null;
  follow_count: number | null;
  share_count: number | null;
  read_unit_price: number | null;
  interaction_unit_price: number | null;
  
  // 总流量效果字段
  total_exposure_count: number | null;
  total_exposure_ranking: string | null;
  total_read_count: number | null;
  total_read_ranking: string | null;
  total_interaction_count: number | null;
  total_interaction_ranking: string | null;
  total_interaction_rate: number | null;
  total_interaction_rate_ranking: string | null;
  total_read_rate: number | null;
  total_read_rate_ranking: string | null;
  avg_read_duration: number | null;
  three_sec_read_rate: number | null;
  five_sec_video_completion_rate: number | null;
  video_completion_rate: number | null;
  
  // 自然流量效果字段
  natural_exposure_count: number | null;
  natural_exposure_ranking: string | null;
  natural_read_count: number | null;
  natural_read_ranking: string | null;
  natural_read_rate: number | null;
  natural_read_rate_ranking: string | null;
  
  // 推广流量效果字段
  promotion_total_exposure_count: number | null;
  promotion_total_read_count: number | null;
  bidding_promotion_exposure_count: number | null;
  bidding_promotion_exposure_ranking: string | null;
  bidding_promotion_click_count: number | null;
  bidding_promotion_click_ranking: string | null;
  bidding_promotion_click_rate: number | null;
  bidding_promotion_click_rate_ranking: string | null;
  bidding_promotion_interaction_count: number | null;
  bidding_promotion_interaction_ranking: string | null;
  bidding_promotion_interaction_rate: number | null;
  bidding_promotion_interaction_rate_ranking: string | null;
  
  // 其他推广字段
  bidding_info_stream_exposure_count: number | null;
  bidding_info_stream_click_count: number | null;
  bidding_info_stream_click_rate: number | null;
  bidding_info_stream_interaction_count: number | null;
  bidding_info_stream_interaction_rate: number | null;
  bidding_video_stream_exposure_count: number | null;
  bidding_video_stream_click_count: number | null;
  bidding_video_stream_click_rate: number | null;
  bidding_video_stream_interaction_count: number | null;
  bidding_video_stream_interaction_rate: number | null;
  bidding_search_exposure_count: number | null;
  bidding_search_click_count: number | null;
  bidding_search_click_rate: number | null;
  bidding_search_interaction_count: number | null;
  bidding_search_interaction_rate: number | null;
  brand_ad_exposure_count: number | null;
  brand_ad_click_count: number | null;
  brand_ad_click_rate: number | null;
  
  // 转化指标字段
  seven_day_payment_orders: number | null;
  seven_day_payment_amount: number | null;
  seven_day_payment_conversion_rate: number | null;
  seven_day_payment_roi: number | null;
  live_room_valid_views: number | null;
  store_visits: number | null;
  product_visitors: number | null;
  product_add_to_cart: number | null;
  one_day_payment_conversion_rate: number | null;
  form_submissions: number | null;
  private_message_consultations: number | null;
  private_message_openings: number | null;
  private_message_leads: number | null;
  form_conversion_rate: number | null;
  
  // 加热推广字段
  heating_boost_exposure_count: number | null;
  heating_boost_click_count: number | null;
  heating_boost_click_rate: number | null;
  heating_boost_private_message_count: number | null;
  heating_boost_private_message_rate: number | null;
  heating_boost_lead_count: number | null;
  heating_boost_lead_rate: number | null;
  
  // 跨域字段
  cross_domain_exposure_count: number | null;
  cross_domain_click_count: number | null;
  cross_domain_click_rate: number | null;
  cross_domain_private_message_count: number | null;
  cross_domain_private_message_rate: number | null;
  cross_domain_lead_count: number | null;
  cross_domain_lead_rate: number | null;
  cross_domain_opening_count: number | null;
  cross_domain_opening_rate: number | null;
  cross_domain_retention_count: number | null;
  cross_domain_retention_rate: number | null;
  cross_domain_form_lead_count: number | null;
  cross_domain_form_lead_rate: number | null;
  cross_domain_form_opening_count: number | null;
  cross_domain_form_opening_rate: number | null;
  cross_domain_form_retention_count: number | null;
  cross_domain_form_retention_rate: number | null;
  cross_domain_total_lead_count: number | null;
  cross_domain_total_lead_rate: number | null;
  cross_domain_total_opening_count: number | null;
  cross_domain_total_opening_rate: number | null;
  cross_domain_total_retention_count: number | null;
  cross_domain_total_retention_rate: number | null;
  cross_domain_heating_boost_exposure_count: number | null;
  cross_domain_heating_boost_click_count: number | null;
  cross_domain_heating_boost_click_rate: number | null;
  cross_domain_heating_boost_private_message_count: number | null;
  cross_domain_heating_boost_private_message_rate: number | null;
  cross_domain_heating_boost_lead_count: number | null;
  cross_domain_heating_boost_lead_rate: number | null;
  cross_domain_heating_boost_opening_count: number | null;
  cross_domain_heating_boost_opening_rate: number | null;
  cross_domain_heating_boost_retention_count: number | null;
  cross_domain_heating_boost_retention_rate: number | null;
  
  // 行业信息
  industry_info: string | null;
}

// 从EmployeeNotes页面复制的完整parseFileData函数
export const parseFileData = async (file: File): Promise<ImportData[]> => {
  return new Promise<ImportData[]>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(fileData, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 获取原始数据，包括表头
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log('Excel原始数据:', {
          sheetNames: workbook.SheetNames,
          totalRows: rawData.length,
          headers: rawData.slice(0, 3) // 显示前3行作为表头
        });
        
        if (rawData.length < 2) {
          throw new Error('Excel文件数据不足');
        }
        
        // 处理级联表头
        let headers: string[] = [];
        let dataStartRow = 1;
        
        // 检查是否有级联表头（多行表头）
        if (rawData.length >= 3) {
          // 对于复杂的级联表头，直接使用第二行作为列名
          const headerRow2 = (rawData[1] as any[]) || [];
          headers = headerRow2.map((cell: any, index: number) => {
            // 简化表头，提取关键信息
            if (!cell) return `列${index + 1}`;
            
            // 尝试提取关键信息
            const cellStr = String(cell);
            if (cellStr.includes('笔记名称')) return '笔记名称';
            if (cellStr.includes('笔记id')) return '笔记ID';
            if (cellStr.includes('笔记发布时间')) return '发布时间';
            if (cellStr.includes('笔记创作者名称')) return '创作者名称';
            if (cellStr.includes('笔记状态')) return '笔记状态';
            if (cellStr.includes('博主垂类')) return '博主垂类';
            if (cellStr.includes('博主报价')) return '博主报价';
            if (cellStr.includes('服务费金额')) return '服务费金额';
            if (cellStr.includes('全部曝光量') && !cellStr.includes('排名')) return '总曝光量';
            if (cellStr.includes('全部阅读量') && !cellStr.includes('排名')) return '总阅读量';
            if (cellStr.includes('全部互动量') && !cellStr.includes('排名')) return '总互动量';
            if (cellStr.includes('全部阅读率') && !cellStr.includes('排名')) return '总阅读率';
            if (cellStr.includes('全部互动率') && !cellStr.includes('排名')) return '总互动率';
            if (cellStr.includes('平均阅读时长')) return '平均阅读时长';
            if (cellStr.includes('3S图文阅读率')) return '3秒阅读率';
            if (cellStr.includes('自然曝光量') && !cellStr.includes('排名')) return '自然曝光量';
            if (cellStr.includes('自然阅读量') && !cellStr.includes('排名')) return '自然阅读量';
            if (cellStr.includes('自然阅读率') && !cellStr.includes('排名')) return '自然阅读率';
            if (cellStr.includes('推广总曝光量')) return '推广总曝光量';
            if (cellStr.includes('推广总阅读量')) return '推广总阅读量';
            if (cellStr.includes('竞价推广曝光量') && !cellStr.includes('排名')) return '竞价推广曝光量';
            if (cellStr.includes('竞价推广点击量') && !cellStr.includes('排名')) return '竞价推广点击量';
            if (cellStr.includes('竞价推广点击率') && !cellStr.includes('排名')) return '竞价推广点击率';
            if (cellStr.includes('竞价推广互动量') && !cellStr.includes('排名')) return '竞价推广互动量';
            if (cellStr.includes('竞价推广互动率') && !cellStr.includes('排名')) return '竞价推广互动率';
            if (cellStr.includes('表单提交')) return '表单提交数';
            if (cellStr.includes('私信咨询数')) return '私信咨询数';
            if (cellStr.includes('私信开口数')) return '私信开口数';
            if (cellStr.includes('私信留资数')) return '私信留资数';
            if (cellStr.includes('表单转化率')) return '表单转化率';
            if (cellStr.includes('7日支付订单量')) return '7天支付订单数';
            if (cellStr.includes('7日支付金额')) return '7天支付金额';
            if (cellStr.includes('7日支付转化率')) return '7天支付转化率';
            if (cellStr.includes('7日支付ROI')) return '7天支付ROI';
            if (cellStr.includes('员工姓名')) return '员工姓名';
            
            // 如果都不匹配，返回原始值
            return cellStr || `列${index + 1}`;
          });
          
          dataStartRow = 2; // 数据从第3行开始
        } else {
          // 单行表头
          headers = (rawData[0] as string[]) || [];
          dataStartRow = 1;
        }
        
        console.log('处理后的表头:', headers);
        
        // 优化的数值解析函数
        const safeParseNumber = (value: any, isFloat: boolean = false): number => {
          if (value === null || value === undefined || value === '') return 0;
          
          // 转换为字符串并清理
          let str = String(value).trim();
          if (str === '' || str === '-' || str === '数据较少') return 0;
          
          // 移除百分号、逗号、空格等字符
          str = str.replace(/[%,]/g, '');
          
          // 处理百分比格式（如 "13.14%"）
          if (str.includes('%')) {
            str = str.replace('%', '');
            const parsed = parseFloat(str);
            return isNaN(parsed) ? 0 : parsed;
          }
          
          // 处理普通数字
          const parsed = isFloat ? parseFloat(str) : parseInt(str);
          return isNaN(parsed) ? 0 : parsed;
        };

        // 智能数据提取函数
        const extractDataByHeader = (row: any[], targetHeader: string, isFloat: boolean = false): number => {
          for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const cell = row[i];
            
            if (header && header.includes(targetHeader) && !header.includes('排名')) {
              const value = safeParseNumber(cell, isFloat);
              console.log(`找到字段 "${targetHeader}" 在列 ${i}: ${cell} -> ${value}`);
              return value;
            }
          }
          console.log(`未找到字段 "${targetHeader}"`);
          return 0;
        };

        const extractStringByHeader = (row: any[], targetHeader: string): string => {
          for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const cell = row[i];
            
            if (header && header.includes(targetHeader)) {
              const value = cell ? String(cell).trim() : '';
              console.log(`找到字段 "${targetHeader}" 在列 ${i}: ${cell} -> ${value}`);
              return value;
            }
          }
          console.log(`未找到字段 "${targetHeader}"`);
          return '';
        };
        
        // 处理数据行
        const processedData: ImportData[] = [];
        for (let i = dataStartRow; i < rawData.length; i++) {
          const row = rawData[i] as any[];
          if (!row || row.every((cell: any) => !cell)) continue; // 跳过空行
          
          console.log(`第${i + 1}行原始数据:`, row);
          console.log(`第${i + 1}行表头:`, headers);
          
          // 使用智能提取函数
          const noteTitle = extractStringByHeader(row, '笔记名称');
          const noteId = extractStringByHeader(row, '笔记ID');
          const creatorName = extractStringByHeader(row, '创作者名称');
          const employeeName = extractStringByHeader(row, '员工标签');
          const publishTime = extractStringByHeader(row, '发布时间');
          const noteStatus = extractStringByHeader(row, '笔记状态') || '已发布';
          const bloggerCategory = extractStringByHeader(row, '博主垂类');
          
          // 添加缺失字段的提取
          const noteSource = extractStringByHeader(row, '笔记来源');
          const noteType = extractStringByHeader(row, '笔记类型');
          const noteLink = extractStringByHeader(row, '笔记链接');
          const creatorId = extractStringByHeader(row, '笔记创作者ID');
          const followerCount = extractDataByHeader(row, '作者粉丝量');
          const customTags = extractStringByHeader(row, '自定义标签');
          const productBindingStatus = extractStringByHeader(row, '产品绑定状态');
          const contentTags = extractStringByHeader(row, '内容标签');
          const isPromoted = extractStringByHeader(row, '笔记是否已推广');
          const employeeRegion = extractStringByHeader(row, '员工所属地域');
          
          // 地域分布字段
          const regionProvinceTop1 = extractStringByHeader(row, '地域分布-省份（top1及占比）');
          const regionProvinceTop2 = extractStringByHeader(row, '地域分布-省份（top2及占比）');
          const regionProvinceTop3 = extractStringByHeader(row, '地域分布-省份（top3及占比）');
          const regionCityTop1 = extractStringByHeader(row, '地域分布-城市（top1及占比）');
          const regionCityTop2 = extractStringByHeader(row, '地域分布-城市（top2及占比）');
          const regionCityTop3 = extractStringByHeader(row, '地域分布-城市（top3及占比）');
          
          // 用户兴趣字段
          const userInterestTop1 = extractStringByHeader(row, '用户兴趣（top1及占比）');
          const userInterestTop2 = extractStringByHeader(row, '用户兴趣（top2及占比）');
          const userInterestTop3 = extractStringByHeader(row, '用户兴趣（top3及占比）');
          
          // 基础流量字段
          const readUv = extractDataByHeader(row, '阅读uv');
          const likeCount = extractDataByHeader(row, '点赞量');
          const commentCount = extractDataByHeader(row, '评论量');
          const collectCount = extractDataByHeader(row, '收藏量');
          const followCount = extractDataByHeader(row, '关注量');
          const shareCount = extractDataByHeader(row, '分享量');
          const readUnitPrice = extractDataByHeader(row, '阅读单价', true);
          const interactionUnitPrice = extractDataByHeader(row, '互动单价', true);
          
          // 排名字段
          const totalExposureRanking = extractStringByHeader(row, '全部曝光量行业排名');
          const totalReadRanking = extractStringByHeader(row, '全部阅读量行业排名');
          const totalInteractionRanking = extractStringByHeader(row, '全部互动量行业排名');
          const totalInteractionRateRanking = extractStringByHeader(row, '全部互动率行业排名');
          const totalReadRateRanking = extractStringByHeader(row, '全部阅读率行业排名');
          
          // 视频相关字段
          const fiveSecVideoCompletionRate = extractDataByHeader(row, '5S视频完播率', true);
          const videoCompletionRate = extractDataByHeader(row, '视频笔记完播率', true);
          
          // 自然流量排名
          const naturalExposureRanking = extractStringByHeader(row, '自然曝光量行业排名');
          const naturalReadRanking = extractStringByHeader(row, '自然阅读量行业排名');
          const naturalReadRateRanking = extractStringByHeader(row, '自然阅读率行业排名');
          
          // 竞价推广排名
          const biddingPromotionExposureRanking = extractStringByHeader(row, '竞价推广曝光量行业排名');
          const biddingPromotionClickRanking = extractStringByHeader(row, '竞价推广点击量行业排名');
          const biddingPromotionClickRateRanking = extractStringByHeader(row, '竞价推广点击率行业排名');
          const biddingPromotionInteractionRanking = extractStringByHeader(row, '竞价推广互动量行业排名');
          const biddingPromotionInteractionRateRanking = extractStringByHeader(row, '竞价推广互动率行业排名');
          
          // 其他推广字段
          const biddingInfoStreamExposureCount = extractDataByHeader(row, '竞价信息流曝光量');
          const biddingInfoStreamClickCount = extractDataByHeader(row, '竞价信息流点击量');
          const biddingInfoStreamClickRate = extractDataByHeader(row, '竞价信息流点击率', true);
          const biddingInfoStreamInteractionCount = extractDataByHeader(row, '竞价信息流互动量');
          const biddingInfoStreamInteractionRate = extractDataByHeader(row, '竞价信息流互动率', true);
          
          const biddingVideoStreamExposureCount = extractDataByHeader(row, '竞价视频流曝光量');
          const biddingVideoStreamClickCount = extractDataByHeader(row, '竞价视频流点击量');
          const biddingVideoStreamClickRate = extractDataByHeader(row, '竞价视频流点击率', true);
          const biddingVideoStreamInteractionCount = extractDataByHeader(row, '竞价视频流互动量');
          const biddingVideoStreamInteractionRate = extractDataByHeader(row, '竞价视频流互动率', true);
          
          const biddingSearchExposureCount = extractDataByHeader(row, '竞价搜索曝光量');
          const biddingSearchClickCount = extractDataByHeader(row, '竞价搜索点击量');
          const biddingSearchClickRate = extractDataByHeader(row, '竞价搜索点击率', true);
          const biddingSearchInteractionCount = extractDataByHeader(row, '竞价搜索互动量');
          const biddingSearchInteractionRate = extractDataByHeader(row, '竞价搜索互动率', true);
          
          const brandAdExposureCount = extractDataByHeader(row, '品牌广告曝光量');
          const brandAdClickCount = extractDataByHeader(row, '品牌广告点击量');
          const brandAdClickRate = extractDataByHeader(row, '品牌广告点击率', true);
          
          // 转化指标字段
          const liveRoomValidViews = extractDataByHeader(row, '直播间有效观看次数');
          const storeVisits = extractDataByHeader(row, '进店访问量');
          const productVisitors = extractDataByHeader(row, '商品访客量');
          const productAddToCart = extractDataByHeader(row, '商品加购量');
          const oneDayPaymentConversionRate = extractDataByHeader(row, '1日支付转化率', true);
          
          // 加热推广字段
          const heatingBoostExposureCount = extractDataByHeader(row, '加热助推总曝光量');
          const heatingBoostClickCount = extractDataByHeader(row, '加热助推总阅读量');
          const heatingBoostClickRate = extractDataByHeader(row, '加热助推点击率', true);
          const heatingBoostPrivateMessageCount = extractDataByHeader(row, '加热助推私信数');
          const heatingBoostPrivateMessageRate = extractDataByHeader(row, '加热助推私信率', true);
          const heatingBoostLeadCount = extractDataByHeader(row, '加热助推留资数');
          const heatingBoostLeadRate = extractDataByHeader(row, '加热助推留资率', true);
          
          // 跨域字段（这些字段在Excel中可能不存在，设为0）
          const crossDomainExposureCount = 0;
          const crossDomainClickCount = 0;
          const crossDomainClickRate = 0;
          const crossDomainPrivateMessageCount = 0;
          const crossDomainPrivateMessageRate = 0;
          const crossDomainLeadCount = 0;
          const crossDomainLeadRate = 0;
          const crossDomainOpeningCount = 0;
          const crossDomainOpeningRate = 0;
          const crossDomainRetentionCount = 0;
          const crossDomainRetentionRate = 0;
          const crossDomainFormLeadCount = 0;
          const crossDomainFormLeadRate = 0;
          const crossDomainFormOpeningCount = 0;
          const crossDomainFormOpeningRate = 0;
          const crossDomainFormRetentionCount = 0;
          const crossDomainFormRetentionRate = 0;
          const crossDomainTotalLeadCount = 0;
          const crossDomainTotalLeadRate = 0;
          const crossDomainTotalOpeningCount = 0;
          const crossDomainTotalOpeningRate = 0;
          const crossDomainTotalRetentionCount = 0;
          const crossDomainTotalRetentionRate = 0;
          const crossDomainHeatingBoostExposureCount = 0;
          const crossDomainHeatingBoostClickCount = 0;
          const crossDomainHeatingBoostClickRate = 0;
          const crossDomainHeatingBoostPrivateMessageCount = 0;
          const crossDomainHeatingBoostPrivateMessageRate = 0;
          const crossDomainHeatingBoostLeadCount = 0;
          const crossDomainHeatingBoostLeadRate = 0;
          const crossDomainHeatingBoostOpeningCount = 0;
          const crossDomainHeatingBoostOpeningRate = 0;
          const crossDomainHeatingBoostRetentionCount = 0;
          const crossDomainHeatingBoostRetentionRate = 0;
          
          // 提取数值信息
          const totalExposureCount = extractDataByHeader(row, '总曝光量');
          const totalReadCount = extractDataByHeader(row, '总阅读量');
          const totalInteractionCount = extractDataByHeader(row, '总互动量');
          const totalReadRate = extractDataByHeader(row, '总阅读率', true);
          const totalInteractionRate = extractDataByHeader(row, '总互动率', true);
          const avgReadDuration = extractDataByHeader(row, '平均阅读时长', true);
          const threeSecReadRate = extractDataByHeader(row, '3秒阅读率', true);
          
          const naturalExposureCount = extractDataByHeader(row, '自然曝光量');
          const naturalReadCount = extractDataByHeader(row, '自然阅读量');
          const naturalReadRate = extractDataByHeader(row, '自然阅读率', true);
          
          const promotionTotalExposureCount = extractDataByHeader(row, '推广总曝光量');
          const promotionTotalReadCount = extractDataByHeader(row, '推广总阅读量');
          
          const biddingPromotionExposureCount = extractDataByHeader(row, '竞价推广曝光量');
          const biddingPromotionClickCount = extractDataByHeader(row, '竞价推广点击量');
          const biddingPromotionClickRate = extractDataByHeader(row, '竞价推广点击率', true);
          const biddingPromotionInteractionCount = extractDataByHeader(row, '竞价推广互动量');
          const biddingPromotionInteractionRate = extractDataByHeader(row, '竞价推广互动率', true);
          
          const formSubmissions = extractDataByHeader(row, '表单提交数');
          const privateMessageConsultations = extractDataByHeader(row, '私信咨询数');
          const privateMessageOpenings = extractDataByHeader(row, '私信开口数');
          const privateMessageLeads = extractDataByHeader(row, '私信留资数');
          const formConversionRate = extractDataByHeader(row, '表单转化率', true);
          
          const sevenDayPaymentOrders = extractDataByHeader(row, '7天支付订单数');
          const sevenDayPaymentAmount = extractDataByHeader(row, '7天支付金额', true);
          const sevenDayPaymentConversionRate = extractDataByHeader(row, '7天支付转化率', true);
          const sevenDayPaymentRoi = extractDataByHeader(row, '7天支付ROI', true);
          
          const bloggerQuotation = extractDataByHeader(row, '博主报价', true);
          const serviceFee = extractDataByHeader(row, '服务费金额', true);
          
          // 调试信息
          console.log(`第${i + 1}行解析结果:`, {
            noteTitle,
            noteId,
            creatorName,
            employeeName,
            totalExposureCount,
            totalReadCount,
            totalInteractionCount,
            totalReadRate,
            totalInteractionRate
          });
          
          // 添加详细的数值调试信息
          console.log(`第${i + 1}行数值提取详情:`, {
            '总曝光量': totalExposureCount,
            '总阅读量': totalReadCount,
            '总互动量': totalInteractionCount,
            '总阅读率': totalReadRate,
            '总互动率': totalInteractionRate,
            '自然曝光量': naturalExposureCount,
            '自然阅读量': naturalReadCount,
            '自然阅读率': naturalReadRate,
            '平均阅读时长': avgReadDuration,
            '3秒阅读率': threeSecReadRate
          });
          
          // 添加基础信息调试
          console.log(`第${i + 1}行基础信息提取详情:`, {
            '笔记来源': noteSource,
            '笔记类型': noteType,
            '笔记链接': noteLink,
            '创作者ID': creatorId,
            '粉丝数': followerCount,
            '自定义标签': customTags,
            '产品绑定状态': productBindingStatus,
            '内容标签': contentTags,
            '是否已推广': isPromoted,
            '员工所属地域': employeeRegion
          });
          
          // 添加完整字段映射调试
          console.log(`第${i + 1}行完整字段映射:`, {
            // 基础信息
            note_source: noteSource,
            note_type: noteType,
            note_title: noteTitle,
            note_id: noteId,
            note_link: noteLink,
            creator_name: creatorName,
            creator_id: creatorId,
            follower_count: followerCount,
            note_status: noteStatus,
            custom_tags: customTags,
            product_binding_status: productBindingStatus,
            blogger_category: bloggerCategory,
            blogger_quotation: bloggerQuotation,
            service_fee: serviceFee,
            content_tags: contentTags,
            is_promoted: isPromoted,
            employee_region: employeeRegion,
            employee_name: employeeName,
            
            // 地域分布
            region_province_top1: regionProvinceTop1,
            region_province_top2: regionProvinceTop2,
            region_province_top3: regionProvinceTop3,
            region_city_top1: regionCityTop1,
            region_city_top2: regionCityTop2,
            region_city_top3: regionCityTop3,
            
            // 用户兴趣
            user_interest_top1: userInterestTop1,
            user_interest_top2: userInterestTop2,
            user_interest_top3: userInterestTop3,
            
            // 基础流量
            read_uv: readUv,
            like_count: likeCount,
            comment_count: commentCount,
            collect_count: collectCount,
            follow_count: followCount,
            share_count: shareCount,
            read_unit_price: readUnitPrice,
            interaction_unit_price: interactionUnitPrice,
            
            // 总流量效果
            total_exposure_count: totalExposureCount,
            total_exposure_ranking: totalExposureRanking,
            total_read_count: totalReadCount,
            total_read_ranking: totalReadRanking,
            total_interaction_count: totalInteractionCount,
            total_interaction_ranking: totalInteractionRanking,
            total_interaction_rate: totalInteractionRate,
            total_interaction_rate_ranking: totalInteractionRateRanking,
            total_read_rate: totalReadRate,
            total_read_rate_ranking: totalReadRateRanking,
            avg_read_duration: avgReadDuration,
            three_sec_read_rate: threeSecReadRate,
            five_sec_video_completion_rate: fiveSecVideoCompletionRate,
            video_completion_rate: videoCompletionRate,
            
            // 自然流量
            natural_exposure_count: naturalExposureCount,
            natural_exposure_ranking: naturalExposureRanking,
            natural_read_count: naturalReadCount,
            natural_read_ranking: naturalReadRanking,
            natural_read_rate: naturalReadRate,
            natural_read_rate_ranking: naturalReadRateRanking,
            
            // 推广流量
            promotion_total_exposure_count: promotionTotalExposureCount,
            promotion_total_read_count: promotionTotalReadCount,
            bidding_promotion_exposure_count: biddingPromotionExposureCount,
            bidding_promotion_exposure_ranking: biddingPromotionExposureRanking,
            bidding_promotion_click_count: biddingPromotionClickCount,
            bidding_promotion_click_ranking: biddingPromotionClickRanking,
            bidding_promotion_click_rate: biddingPromotionClickRate,
            bidding_promotion_click_rate_ranking: biddingPromotionClickRateRanking,
            bidding_promotion_interaction_count: biddingPromotionInteractionCount,
            bidding_promotion_interaction_ranking: biddingPromotionInteractionRanking,
            bidding_promotion_interaction_rate: biddingPromotionInteractionRate,
            bidding_promotion_interaction_rate_ranking: biddingPromotionInteractionRateRanking,
            
            // 转化指标
            form_submissions: formSubmissions,
            private_message_consultations: privateMessageConsultations,
            private_message_openings: privateMessageOpenings,
            private_message_leads: privateMessageLeads,
            form_conversion_rate: formConversionRate,
            seven_day_payment_orders: sevenDayPaymentOrders,
            seven_day_payment_amount: sevenDayPaymentAmount,
            seven_day_payment_conversion_rate: sevenDayPaymentConversionRate,
            seven_day_payment_roi: sevenDayPaymentRoi
          });
          
          // 创建标准格式的数据对象
          const processedRow: ImportData = {
            // 基础信息
            note_title: noteTitle,
            note_id: noteId || `note_${Date.now()}_${i}`,
            creator_name: creatorName,
            employee_name: employeeName,
            publish_time: publishTime || null,
            note_status: noteStatus,
            blogger_category: bloggerCategory,
            blogger_quotation: bloggerQuotation,
            service_fee: serviceFee,
            
            // 流量效果
            total_exposure_count: totalExposureCount,
            total_read_count: totalReadCount,
            total_interaction_count: totalInteractionCount,
            total_read_rate: totalReadRate,
            total_interaction_rate: totalInteractionRate,
            avg_read_duration: avgReadDuration,
            three_sec_read_rate: threeSecReadRate,
            
            // 自然流量
            natural_exposure_count: naturalExposureCount,
            natural_read_count: naturalReadCount,
            natural_read_rate: naturalReadRate,
            
            // 推广流量
            promotion_total_exposure_count: promotionTotalExposureCount,
            promotion_total_read_count: promotionTotalReadCount,
            bidding_promotion_exposure_count: biddingPromotionExposureCount,
            bidding_promotion_click_count: biddingPromotionClickCount,
            bidding_promotion_click_rate: biddingPromotionClickRate,
            bidding_promotion_interaction_count: biddingPromotionInteractionCount,
            bidding_promotion_interaction_rate: biddingPromotionInteractionRate,
            
            // 转化指标
            form_submissions: formSubmissions,
            private_message_consultations: privateMessageConsultations,
            private_message_openings: privateMessageOpenings,
            private_message_leads: privateMessageLeads,
            form_conversion_rate: formConversionRate,
            seven_day_payment_orders: sevenDayPaymentOrders,
            seven_day_payment_amount: sevenDayPaymentAmount,
            seven_day_payment_conversion_rate: sevenDayPaymentConversionRate,
            seven_day_payment_roi: sevenDayPaymentRoi,
            
            // 其他必需字段（设为null）
            note_source: noteSource,
            note_type: noteType,
            note_link: noteLink,
            creator_id: creatorId,
            follower_count: followerCount,
            custom_tags: customTags,
            product_binding_status: productBindingStatus,
            content_tags: contentTags,
            is_promoted: isPromoted,
            employee_region: employeeRegion,
            region_province_top1: regionProvinceTop1,
            region_province_top2: regionProvinceTop2,
            region_province_top3: regionProvinceTop3,
            region_city_top1: regionCityTop1,
            region_city_top2: regionCityTop2,
            region_city_top3: regionCityTop3,
            user_interest_top1: userInterestTop1,
            user_interest_top2: userInterestTop2,
            user_interest_top3: userInterestTop3,
            read_uv: readUv,
            like_count: likeCount,
            comment_count: commentCount,
            collect_count: collectCount,
            follow_count: followCount,
            share_count: shareCount,
            read_unit_price: readUnitPrice,
            interaction_unit_price: interactionUnitPrice,
            total_exposure_ranking: totalExposureRanking,
            total_read_ranking: totalReadRanking,
            total_interaction_ranking: totalInteractionRanking,
            total_interaction_rate_ranking: totalInteractionRateRanking,
            total_read_rate_ranking: totalReadRateRanking,
            five_sec_video_completion_rate: fiveSecVideoCompletionRate,
            video_completion_rate: videoCompletionRate,
            natural_exposure_ranking: naturalExposureRanking,
            natural_read_ranking: naturalReadRanking,
            natural_read_rate_ranking: naturalReadRateRanking,
            bidding_promotion_exposure_ranking: biddingPromotionExposureRanking,
            bidding_promotion_click_ranking: biddingPromotionClickRanking,
            bidding_promotion_click_rate_ranking: biddingPromotionClickRateRanking,
            bidding_promotion_interaction_ranking: biddingPromotionInteractionRanking,
            bidding_promotion_interaction_rate_ranking: biddingPromotionInteractionRateRanking,
            bidding_info_stream_exposure_count: biddingInfoStreamExposureCount,
            bidding_info_stream_click_count: biddingInfoStreamClickCount,
            bidding_info_stream_click_rate: biddingInfoStreamClickRate,
            bidding_info_stream_interaction_count: biddingInfoStreamInteractionCount,
            bidding_info_stream_interaction_rate: biddingInfoStreamInteractionRate,
            bidding_video_stream_exposure_count: biddingVideoStreamExposureCount,
            bidding_video_stream_click_count: biddingVideoStreamClickCount,
            bidding_video_stream_click_rate: biddingVideoStreamClickRate,
            bidding_video_stream_interaction_count: biddingVideoStreamInteractionCount,
            bidding_video_stream_interaction_rate: biddingVideoStreamInteractionRate,
            bidding_search_exposure_count: biddingSearchExposureCount,
            bidding_search_click_count: biddingSearchClickCount,
            bidding_search_click_rate: biddingSearchClickRate,
            bidding_search_interaction_count: biddingSearchInteractionCount,
            bidding_search_interaction_rate: biddingSearchInteractionRate,
            brand_ad_exposure_count: brandAdExposureCount,
            brand_ad_click_count: brandAdClickCount,
            brand_ad_click_rate: brandAdClickRate,
            live_room_valid_views: liveRoomValidViews,
            store_visits: storeVisits,
            product_visitors: productVisitors,
            product_add_to_cart: productAddToCart,
            one_day_payment_conversion_rate: oneDayPaymentConversionRate,
            heating_boost_exposure_count: heatingBoostExposureCount,
            heating_boost_click_count: heatingBoostClickCount,
            heating_boost_click_rate: heatingBoostClickRate,
            heating_boost_private_message_count: heatingBoostPrivateMessageCount,
            heating_boost_private_message_rate: heatingBoostPrivateMessageRate,
            heating_boost_lead_count: heatingBoostLeadCount,
            heating_boost_lead_rate: heatingBoostLeadRate,
            cross_domain_exposure_count: crossDomainExposureCount,
            cross_domain_click_count: crossDomainClickCount,
            cross_domain_click_rate: crossDomainClickRate,
            cross_domain_private_message_count: crossDomainPrivateMessageCount,
            cross_domain_private_message_rate: crossDomainPrivateMessageRate,
            cross_domain_lead_count: crossDomainLeadCount,
            cross_domain_lead_rate: crossDomainLeadRate,
            cross_domain_opening_count: crossDomainOpeningCount,
            cross_domain_opening_rate: crossDomainOpeningRate,
            cross_domain_retention_count: crossDomainRetentionCount,
            cross_domain_retention_rate: crossDomainRetentionRate,
            cross_domain_form_lead_count: crossDomainFormLeadCount,
            cross_domain_form_lead_rate: crossDomainFormLeadRate,
            cross_domain_form_opening_count: crossDomainFormOpeningCount,
            cross_domain_form_opening_rate: crossDomainFormOpeningRate,
            cross_domain_form_retention_count: crossDomainFormRetentionCount,
            cross_domain_form_retention_rate: crossDomainFormRetentionRate,
            cross_domain_total_lead_count: crossDomainTotalLeadCount,
            cross_domain_total_lead_rate: crossDomainTotalLeadRate,
            cross_domain_total_opening_count: crossDomainTotalOpeningCount,
            cross_domain_total_opening_rate: crossDomainTotalOpeningRate,
            cross_domain_total_retention_count: crossDomainTotalRetentionCount,
            cross_domain_total_retention_rate: crossDomainTotalRetentionRate,
            cross_domain_heating_boost_exposure_count: crossDomainHeatingBoostExposureCount,
            cross_domain_heating_boost_click_count: crossDomainHeatingBoostClickCount,
            cross_domain_heating_boost_click_rate: crossDomainHeatingBoostClickRate,
            cross_domain_heating_boost_private_message_count: crossDomainHeatingBoostPrivateMessageCount,
            cross_domain_heating_boost_private_message_rate: crossDomainHeatingBoostPrivateMessageRate,
            cross_domain_heating_boost_lead_count: crossDomainHeatingBoostLeadCount,
            cross_domain_heating_boost_lead_rate: crossDomainHeatingBoostLeadRate,
            cross_domain_heating_boost_opening_count: crossDomainHeatingBoostOpeningCount,
            cross_domain_heating_boost_opening_rate: crossDomainHeatingBoostOpeningRate,
            cross_domain_heating_boost_retention_count: crossDomainHeatingBoostRetentionCount,
            cross_domain_heating_boost_retention_rate: crossDomainHeatingBoostRetentionRate,
            industry_info: null
          };
          
          // 只添加有基本数据的行
          if (processedRow.note_title || processedRow.creator_name || processedRow.note_id) {
            processedData.push(processedRow);
          }
        }
        
        console.log('解析后的数据:', processedData);
        
        // 数据质量检查和清理
        console.log('📊 开始数据质量检查...');
        const qualityReport = checkDataQuality(processedData);
        console.log('数据质量报告:', qualityReport);
        
        if (qualityReport.invalidRecords > 0) {
          console.warn('发现数据质量问题:', qualityReport.errors);
        }
        
        // 数据清理和标准化
        const cleanedData = cleanAndStandardizeData(processedData);
        console.log('数据清理完成，标准化后的数据:', cleanedData);
        
        // 验证数据完整性
        if (cleanedData.length > 0) {
          const sampleData = cleanedData[0];
          console.log('数据完整性验证:', {
            '基础信息': {
              '笔记标题': sampleData.note_title,
              '创作者': sampleData.creator_name,
              '笔记ID': sampleData.note_id,
              '员工姓名': sampleData.employee_name
            },
            '流量效果': {
              '总曝光量': sampleData.total_exposure_count,
              '总阅读量': sampleData.total_read_count,
              '总互动量': sampleData.total_interaction_count,
              '阅读率': sampleData.total_read_rate,
              '互动率': sampleData.total_interaction_rate
            },
            '转化指标': {
              '表单提交': sampleData.form_submissions,
              '私信咨询': sampleData.private_message_consultations,
              '7天订单数': sampleData.seven_day_payment_orders,
              '7天支付金额': sampleData.seven_day_payment_amount
            }
          });
        }
        
        resolve(cleanedData);
      } catch (error) {
        console.error('解析文件时出错:', error);
        reject(error);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}; 