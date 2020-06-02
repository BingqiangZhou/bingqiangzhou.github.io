---
title: 【日常小结】pipenv虚拟环境
tags: [日常小结系列]
---

[pipenv github](https://github.com/pypa/pipenv)

[Pipenv——最好用的python虚拟环境和包管理工具](https://www.cnblogs.com/zingp/p/8525138.html)

粗略的总结一下使用pipenv创建虚拟环境，主要可以看上面那博客。

<!--more-->

Installation
------------

If you\'re on MacOS, you can install Pipenv easily with Homebrew:

    $ brew install pipenv

Or, if you\'re using Debian Buster+:

    $ sudo apt install pipenv

Or, if you\'re using Fedora 28:

    $ sudo dnf install pipenv
    
Or, if you\'re using FreeBSD:

    # pkg install py36-pipenv

Otherwise, refer to the [documentation](https://pipenv.kennethreitz.org/en/latest/#install-pipenv-today) for instructions.

## 主要使用到的命令

创建虚拟环境过程

    $ pipenv install

使用特定的python环境
    $ pipenv —python 3.7

进入pipenv环境

    $ pipenv shell

pipenv下安装包
    
    $ pipenv install module-name

example：pipenv install tensorflow-gpu

pipenv环境下执行python
    
    $ pipenv run python source.py

pipenv查看已安装的包和包依赖
    
    $ pipenv graph

退出pipenv环境
    
    $ exit 或者 ctrl+d

## pipenv相关命令

☤ Usage
-------

    $ pipenv
    Usage: pipenv [OPTIONS] COMMAND [ARGS]...

    Options:
      --where          Output project home information.
      --venv           Output virtualenv information.
      --py             Output Python interpreter information.
      --envs           Output Environment Variable options.
      --rm             Remove the virtualenv.
      --bare           Minimal output.
      --completion     Output completion (to be eval'd).
      --man            Display manpage.
      --three / --two  Use Python 3/2 when creating virtualenv.
      --python TEXT    Specify which version of Python virtualenv should use.
      --site-packages  Enable site-packages for the virtualenv.
      --version        Show the version and exit.
      -h, --help       Show this message and exit.


    Usage Examples:
       Create a new project using Python 3.7, specifically:
       $ pipenv --python 3.7

       Remove project virtualenv (inferred from current directory):
       $ pipenv --rm

       Install all dependencies for a project (including dev):
       $ pipenv install --dev

       Create a lockfile containing pre-releases:
       $ pipenv lock --pre

       Show a graph of your installed dependencies:
       $ pipenv graph

       Check your installed dependencies for security vulnerabilities:
       $ pipenv check

       Install a local setup.py into your virtual environment/Pipfile:
       $ pipenv install -e .

       Use a lower-level pip command:
       $ pipenv run pip freeze

    Commands:
      check      Checks for security vulnerabilities and against PEP 508 markers
                 provided in Pipfile.
      clean      Uninstalls all packages not specified in Pipfile.lock.
      graph      Displays currently–installed dependency graph information.
      install    Installs provided packages and adds them to Pipfile, or (if no
                 packages are given), installs all packages from Pipfile.
      lock       Generates Pipfile.lock.
      open       View a given module in your editor.
      run        Spawns a command installed into the virtualenv.
      shell      Spawns a shell within the virtualenv.
      sync       Installs all packages specified in Pipfile.lock.
      uninstall  Un-installs a provided package and removes it from Pipfile.
