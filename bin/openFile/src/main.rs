#![allow(non_snake_case)]
#![allow(unused_variables)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(dead_code)]

#[macro_use]
extern crate structopt;
extern crate open;

use std::net::UdpSocket;
use std::process::Command;
use structopt::StructOpt;

#[derive(StructOpt, Debug)]
#[structopt(name = "openFile")]

struct Opt 
{
    #[structopt(short = "v", long = "vs", help = "open in Visual Studio")]
    vs: bool,

    #[structopt(short = "c", long = "code", help = "open in VS Code")]
    code: bool,
}

fn openInVisualStudio(file:String)
{
    let split: Vec<&str> = file.split(":").collect();
    let mut vs = String::from("");
    vs.push_str(&split[0]);
    vs.push(':');
    vs.push_str(&split[1]);
    
    Command::new("openVS.bat")
        .arg(&vs)
        .arg(&split[2])
        .arg("0")
        .spawn()
        .unwrap();
}

fn openInVSCode(file:String)
{
    let mut vscode = String::from("vscode://file/");
    vscode.push_str(&file);
    open::that(vscode).expect("couldn't open!");
}

fn main() 
{
    let args = Opt::from_args();

    // println!("args: {:?}", args);
        
    let socket = UdpSocket::bind("127.0.0.1:9779").expect("couldn't bind UDP socket!");
    socket.set_broadcast(true).expect("set_broadcast failed!");
    
    let mut buf = [0; 10000];
    loop
    {
        match socket.recv(&mut buf)
        {        
            Err(err) => println!("receiving failed: {:?}", err),
            Ok(len)  => {
                let strg = String::from_utf8_lossy(&buf[0..len]).to_string();
                let file = &strg[1..strg.len()-1];
                if args.code
                {
                    openInVSCode(file.to_string());
                }
                if args.vs
                {
                    openInVisualStudio(file.to_string());
                }
            }
        }
    }
}

