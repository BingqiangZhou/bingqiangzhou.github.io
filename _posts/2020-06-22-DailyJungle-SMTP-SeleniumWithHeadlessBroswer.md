---
title: 【日常杂耍】定时获取成绩，新出一门成绩使用邮件提醒
tags: [日常杂耍系列]
---

今天上午考完了这个学期的所有考试，下午就准备写个爬虫，定时获取成绩，新出一门成绩使用邮件提醒，使用`Chrome`无头浏览器配合`Selenium`模块爬取成绩，然后用`IIS`中的虚拟`SMTP`服务器来发送邮件到自己邮箱中，来提醒自己有新的成绩出来了。

<!--more-->

## 爬取成绩

### 1、准备工作

在开始爬取数据前先到做一些准备工作。下载安装`Chrome`浏览器、`chromedriver`以及`selenium`模块。

本来是准备使用[`PhantomJS`](https://phantomjs.org)，奈何开发团队主要人员吵架，然后暂停了项目的开发，`Selenium`的新版本中，也不再支持`PhantomJS`，后来知道了`Firefox`和`Chrome`都是支持无头模式的，所以我决定使用`Chrome`试一试。
    
#### 安装`Chrome`浏览器

```shell
$ sudo apt-get update
$ wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
$ sudo dpkg -i google-chrome-stable_current_amd64.deb
```

如果出现了缺少依赖的情况，可以使用如下命令解决

```shell
$ sudo apt-get -f -y install
```

再重新安装`Chrome`即可，可以通过以下命令查看是否安装正确。

```shell
$ google-chrome --version
$ which google-chrome
```

#### 安装`chromedriver`
    
在[这里](http://chromedriver.storage.googleapis.com/index.html)找到与`Chrome`大版本一致的`chromedriver`，下载下来，并解压到`/usr/bin`或者`/usr/local/bin`目录中，也可以解压到当前吗目录，不过这样后续需要指定`chromedriver`的路径。

```shell
$ wget http://chromedriver.storage.googleapis.com/83.0.4103.39/chromedriver_linux64.zip
$ unzip chromedriver_linux64.zip -d /usr/local/bin
```

如果将`chromedriver`解压到了`/usr/bin`或者`/usr/local/bin`目录中，可以使用如下命令验证一下。

```shell
$ chromedriver --version
```

`Seleium`官方文档中给出了[各个浏览器`WebDriver`的下载地址和加载方式](https://www.selenium.dev/documentation/en/webdriver/driver_requirements/)

#### 安装`selenium`模块
        
这里就不多说了，`pip`，`conda`安装都很容易。


### 2、开始爬取成绩

`Seleium`官方给的[快速入门](ttps://www.selenium.dev/documentation/en/getting_started/)，特别不粗，看一遍，直接就能上手，这里我不具体来说爬成绩的代码，而是简单讲一讲`Seleium`使用`WebDriver`的简单上手。

#### 设置无头加载

```python
chrome_options = webdriver.ChromeOptions()
chrome_options.headless = True
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
```

#### 加载`WebDriver`

以`Chrome`为例。其他浏览器加载方式类似，具体可见[文档](https://www.selenium.dev/documentation/en/webdriver/driver_requirements/)

```python
#Simple assignment
from selenium.webdriver import Chrome

driver = Chrome(executable_path='/usr/bin/chromedriver', options=chrome_options)

#Or use the context manager
from selenium.webdriver import Chrome

with Chrome(executable_path='/usr/bin/chromedriver', options=chrome_options) as driver:
    #your code inside this indent
```

#### 访问网站链接
  
```python
driver.get("https://selenium.dev")
```

#### 等待网站加载完成

- 强制等待

    ```python
    time.sleep(5) # Wait for 5 seconds.
    ```

- 隐性等待

    设置最长等待时间，在没有达到最长时间时加载完成，则进行下一步，到最长等待时间，还没有加载完成，则也惊喜下一步。

    ```python
    driver.implicitly_wait(30)  # 最长等30秒
    ```

- 显性等待

    程序每隔xx秒验证一下条件，如果条件成立了，则执行下一步，否则继续等待，如果超过设置的最长时间，则抛出异常`TimeoutException`。

    ```python
    WebDriverWait(driver, timeout=3).until(some_condition)
    ```

    ```python
    from selenium.webdriver.support.ui import WebDriverWait
    def document_initialised(driver):
        return driver.execute_script("return initialised")

    driver.navigate("file:///race_condition.html")
    WebDriverWait(driver).until(document_initialised)
    el = driver.find_element(By.TAG_NAME, "p")
    assert el.text == "Hello from JavaScript!"
    ```

    ```python
    from selenium.webdriver.support.ui import WebDriverWait

    driver.navigate("file:///race_condition.html")
    el = WebDriverWait(driver).until(lambda d: d.find_element_by_tag_name("p"))
    assert el.text == "Hello from JavaScript!"
    ```

    ```python
    driver = Firefox()
    driver.get("http://somedomain/url_that_delays_loading")
    wait = WebDriverWait(driver, 10, poll_frequency=1, ignored_exceptions=[ElementNotVisibleException, ElementNotSelectableException])
    element = wait.until(EC.element_to_be_clickable((By.XPATH, "//div")))
    ```

#### 浏览器相关操作
  
    ```python
    driver.get("https://selenium.dev")

    driver.current_url

    driver.back()

    driver.forward()

    driver.refresh()

    driver.title

    driver.current_window_handle

    driver.switch_to.window(window_handle)

    # Opens a new tab and switches to new tab
    driver.switch_to.new_window('tab')
    # Opens a new window and switches to new window
    driver.switch_to.new_window('window')

    #Close the tab or window
    driver.close()
    #Switch back to the old tab or window
    driver.switch_to.window(original_window)

    driver.quit()
    ```

    其他窗口相关的操作请看[文档](https://www.selenium.dev/documentation/en/webdriver/browser_manipulation/)。

#### 常用接口获取值

```python
size #获取元素的尺寸
text #获取元素的文本
get_attribute(name) #获取属性值
location #获取元素坐标，先找到要获取的元素，再调用该方法
page_source #返回页面源码
driver.title #返回页面标题
current_url #获取当前页面的URL
is_displayed() #设置该元素是否可见
is_enabled() #判断元素是否被使用
is_selected() #判断元素是否被选中
tag_name #返回元素的tagName
```

#### 定位元素

- 定位单个元素

    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    driver = webdriver.Firefox()
    driver.get("http://www.google.com")
    # Get search box element from webElement 'q' using Find Element
    search_box = driver.find_element(By.NAME, "q")
    search_box.send_keys("webdriver")
    ```

    ```python
    find_element_by_id()
    find_element_by_name()
    find_element_by_xpath()
    find_element_by_link_text()
    find_element_by_partial_link_text()
    find_element_by_tag_name()
    find_element_by_class_name()
    find_element_by_css_selector()
    ```

- 定位多个元素
  
    ```python
    # Get all the elements available with tag name 'p'
    elements = driver.find_elements(By.TAG_NAME, 'p')
    ```

- 从元素中定位元素
  
    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By

    driver = webdriver.Firefox()
    driver.get("http://www.google.com")
    search_form = driver.find_element(By.TAG_NAME, "form")
    search_box = search_form.find_element(By.NAME, "q")
    search_box.send_keys("webdriver")
    ```
   
    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By

    driver = webdriver.Chrome()
    driver.get("https://www.example.com")

    # Get element with tag name 'div'
    element = driver.find_element(By.TAG_NAME, 'div')

    # Get all the elements available with tag name 'p'
    elements = element.find_elements(By.TAG_NAME, 'p')
    for e in elements:
        print(e.text)
    ```

- 定位到焦点的元素

    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By

    driver = webdriver.Chrome()
    driver.get("https://www.google.com")
    driver.find_element(By.CSS_SELECTOR, '[name="q"]').send_keys("webElement")

    # Get attribute of current active element
    attr = driver.switch_to.active_element.get_attribute("title")
    print(attr)
    ```

- 获取元素属性

    ```python
    element.get_attribute("title")
    ```

- 调用截图（需要在有浏览器显示的情况下）

    ```python
    driver.save_screenshot("screenshot.png")
    ```

#### 操作元素

```python
clear()     #清除元素的内容
send_keys() #模拟按键输入
click()     #点击元素
submit()    #提交表单
```

#### 键盘与鼠标操作

- 键盘操作
   
    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    driver = webdriver.Chrome()

    # Navigate to url
    driver.get("http://www.google.com")

    # Enter "webdriver" text and perform "ENTER" keyboard action
    driver.find_element(By.NAME, "q").send_keys("webdriver" + Keys.ENTER)

    # Perform action ctrl + A (modifier CONTROL + Alphabet A) to select the page
    webdriver.ActionChains(driver).key_down(Keys.CONTROL).send_keys("a").perform()
    ```

    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    driver = webdriver.Chrome()

    # Navigate to url
    driver.get("http://www.google.com")

    # Store google search box WebElement
    search = driver.find_element(By.NAME, "q")

    action = webdriver.ActionChains(driver)

    # Enters text "qwerty" with keyDown SHIFT key and after keyUp SHIFT key (QWERTYqwerty)
    action.key_down(Keys.SHIFT).send_keys_to_element(search, "qwerty").key_up(Keys.SHIFT).send_keys("qwerty").perform()
    ```

    ```python
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    driver = webdriver.Chrome()

    # Navigate to url
    driver.get("http://www.google.com")

    # Store 'SearchInput' element
    SearchInput = driver.find_element(By.NAME, "q")
    SearchInput.send_keys("selenium")

    # Clears the entered text
    SearchInput.clear()
    ```

    ```python
    send_keys(Keys.ENTER) #按下回车键
    send_keys(Keys.TAB) #按下Tab制表键
    send_keys(Keys.SPACE) #按下空格键space
    send_keys(Kyes.ESCAPE) #按下回退键Esc
    send_keys(Keys.BACK_SPACE) #按下删除键BackSpace
    send_keys(Keys.SHIFT) #按下shift键
    send_keys(Keys.CONTROL) #按下Ctrl键
    send_keys(Keys.ARROW_DOWN) #按下鼠标光标向下按键
    send_keys(Keys.CONTROL,'a') #组合键全选Ctrl+A
    send_keys(Keys.CONTROL,'c') #组合键复制Ctrl+C
    send_keys(Keys.CONTROL,'x') #组合键剪切Ctrl+X
    send_keys(Keys.CONTROL,'v') #组合键粘贴Ctrl+V
    ```

- 鼠标操作

    ```python
    click()
    context_click(elem) #右击鼠标点击元素elem，另存为等行为
    double_click(elem) #双击鼠标点击元素elem，地图web可实现放大功能
    drag_and_drop(source,target) #拖动鼠标，源元素按下左键移动至目标元素释放
    move_to_element(elem) #鼠标移动到一个元素上
    click_and_hold(elem) #按下鼠标左键在一个元素上
    perform() #在通过调用该函数执行ActionChains中存储行为
    ```

#### Selenium小结

在实现需求的过程中，遇到了一直提醒浏览器版本过低的问题，然后使用如下语句，点击提醒框的确定按钮，进入下一步。

```python
alert = browser.switch_to.alert
alert.accept()
```

Selenium处理的过程：设置无头加载，加载驱动，加载网页，等待加载完成，爬取数据。

## 邮件发送

### 1、在IIS上搭建SMTP服务器

这里主要参考CSDN中的一篇博客[Windows Server 2012 r2搭建SMTP](https://blog.csdn.net/leelyliu/article/details/80840443)，这里放上博客中给出的图，以后好找到。

- 1、打开控制面板选择打开或关闭`windows features`，按照提示在features中找到`SMTP`，选择安装；在`Windows Server`中也可以在服务器管理`Server Manage`中的`Manage`中添加。

    ![添加SMTP](/assets/images/2020/20200622/smtp-setting-1.png)

- 2、打开IIS6.0，这里需要注意的是IIS6.0，点击windows窗口图标，在search中输入“iis”，选择打开iis 6.0 Manager；在`Windows Server`中也可以在服务器管理`Server Manage`中`Tools`中打开。

    ![打开IIS 6](/assets/images/2020/20200622/smtp-setting-2.png)
    
- 3、在打开窗口，`SMTP Vritual Server`右键选择`domain`，并新建一个新的`domain`，按照提示输入名称和类型即可.

    ![创建doamin](/assets/images/2020/20200622/smtp-setting-3.png)

    ![选择domain类型](/assets/images/2020/20200622/smtp-setting-4.png)

    ![输入domain名称](/assets/images/2020/20200622/smtp-setting-5.png)

- 4、设置ip（可以不改默认的`All Unassgined`）以及端口（也可以不改默认的`25`）。

    ![打开属性](/assets/images/2020/20200622/smtp-setting-6.png)

    ![设置ip](/assets/images/2020/20200622/smtp-setting-7.png)

    ![修改端口](/assets/images/2020/20200622/smtp-setting-8.png)

- 5、访问控制，选择基本的明文验证。

    ![设置ip](/assets/images/2020/20200622/smtp-setting-9.png)

    ![修改端口](/assets/images/2020/20200622/smtp-setting-10.png)

- 6、在windows中添加一个用户，用来做明文认证，从“Security”的配置中，将用户分配给SMTP。

    创建用户过程：在【控制面板`Contorl Panel`】中选择【用户账号`User Accounts`】，接着再次选择【用户账号`User Accounts`】，选择【管理另一个账号`Manage another account`】，选择添加一个【添加一个用户账号`add a user account`】，输入账户名密码创建用户。

    ![添加用户权限](/assets/images/2020/20200622/smtp-setting-11.png)

### 2、发送邮件

大致代码如下，发出的邮箱`from_addr`，任意设置，只要符合正确的邮件格式就行，`smtp_server.login('XXX', 'XXXX')`使用上面添加的用户账号密码登录。

```python
import smtplib
from email.mime.text import MIMEText
from email.header import Header

host = 'XXXX'
smtp_server = smtplib.SMTP()
smtp_server.connect(host, 25)
# smtp_server.set_debuglevel(1)
from_addr = 'XXX'
to_addr = 'XXX'
smtp_server.login('XXX', 'XXXX') # 添加到SMTP服务器的用户账号密码

message = MIMEText(content, 'html', 'utf-8')
message['From'] = from_addr
message['To'] = to_addr
message['Subject'] = Header('成绩单', 'utf-8').encode()

smtp_server.sendmail(from_addr, to_addr, message.as_string())
smtp_server.quit()
```

## 总结

`selenium`大概入了下门，`SMTP`基本是复制粘贴的[runoob.com的代码](https://www.runoob.com/python3/python3-smtp.html)，以后有遇到要使用SMTP再具体深入了解了。